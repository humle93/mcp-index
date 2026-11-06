#!/usr/bin/env node
// Validates data/servers.json (the source of truth for this index).
// No dependencies: the checks are plain JavaScript so a contributor only needs Node.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "servers.json");

const KINDS = new Set(["server", "client", "framework", "tool", "registry"]);
const TRANSPORTS = new Set(["stdio", "http", "sse", "websocket"]);
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/;
const TAG_RE = /^[a-z0-9]+(?:[.+-][a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const problems = [];
const warnings = [];

function fail(where, message) {
  problems.push(`${where}: ${message}`);
}

function warn(where, message) {
  warnings.push(`${where}: ${message}`);
}

// Code-point comparison keeps the order identical on every Node version and locale.
function compare(a, b) {
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

let data;
try {
  data = JSON.parse(await readFile(dataPath, "utf8"));
} catch (error) {
  console.error(`mcp-index: cannot read data/servers.json — ${error.message}`);
  process.exit(1);
}

// --- top level -------------------------------------------------------------

if (!isNonEmptyString(data.updated) || !DATE_RE.test(data.updated)) {
  fail("updated", "must be an ISO date (YYYY-MM-DD)");
} else if (Number.isNaN(Date.parse(`${data.updated}T00:00:00Z`))) {
  fail("updated", "is not a real calendar date");
} else if (Date.parse(`${data.updated}T00:00:00Z`) > Date.now()) {
  fail("updated", "must not be in the future");
}

if (!Array.isArray(data.categories) || data.categories.length === 0) {
  fail("categories", "must be a non-empty array");
}

const categories = new Map();
for (const [index, category] of (data.categories ?? []).entries()) {
  const where = `categories[${index}]`;
  if (!category || typeof category !== "object") {
    fail(where, "must be an object");
    continue;
  }
  if (!isNonEmptyString(category.id) || !ID_RE.test(category.id)) {
    fail(where, `id "${category.id}" must be lower-kebab-case`);
  } else if (categories.has(category.id)) {
    fail(where, `duplicate category id "${category.id}"`);
  }
  if (!isNonEmptyString(category.title)) fail(where, "title is required");
  if (!isNonEmptyString(category.blurb)) fail(where, "blurb is required");
  if (isNonEmptyString(category.id)) categories.set(category.id, category);
}

if (!Array.isArray(data.entries) || data.entries.length === 0) {
  fail("entries", "must be a non-empty array");
}

// --- entries ---------------------------------------------------------------

const ids = new Map();
const repos = new Map();

for (const [index, entry] of (data.entries ?? []).entries()) {
  const label = isNonEmptyString(entry?.id) ? `entries["${entry.id}"]` : `entries[${index}]`;
  if (!entry || typeof entry !== "object") {
    fail(label, "must be an object");
    continue;
  }

  if (!isNonEmptyString(entry.id) || !ID_RE.test(entry.id)) {
    fail(label, `id "${entry.id}" must be lower-kebab-case`);
  } else if (ids.has(entry.id)) {
    fail(label, `duplicate id (also used by entries[${ids.get(entry.id)}])`);
  } else {
    ids.set(entry.id, index);
  }

  if (!isNonEmptyString(entry.name)) {
    fail(label, "name is required");
  } else if (entry.name.length > 60) {
    fail(label, "name must be 60 characters or fewer");
  }

  if (!isNonEmptyString(entry.repo) || !REPO_RE.test(entry.repo)) {
    fail(label, `repo "${entry.repo}" must look like "owner/name"`);
  } else {
    const key = entry.repo.toLowerCase();
    if (repos.has(key)) {
      fail(label, `duplicate repo "${entry.repo}" (also used by entries[${repos.get(key)}])`);
    } else {
      repos.set(key, index);
    }
  }

  if (!isNonEmptyString(entry.category) || !categories.has(entry.category)) {
    fail(label, `category "${entry.category}" is not declared in categories[]`);
  }

  if (!KINDS.has(entry.kind)) {
    fail(label, `kind "${entry.kind}" must be one of ${[...KINDS].join(", ")}`);
  }

  if (!isNonEmptyString(entry.description)) {
    fail(label, "description is required");
  } else if (entry.description.length < 12 || entry.description.length > 200) {
    fail(label, "description must be 12–200 characters");
  } else if (!/[.!?]$/.test(entry.description)) {
    warn(label, "description should read as a sentence (end with a period)");
  }

  if (typeof entry.official !== "boolean") {
    fail(label, "official must be true or false");
  }

  if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
    fail(label, "tags must be a non-empty array");
  } else {
    for (const tag of entry.tags) {
      if (!isNonEmptyString(tag) || !TAG_RE.test(tag)) {
        fail(label, `tag "${tag}" must be lower-kebab-case`);
      }
    }
    if (entry.tags.length > 8) fail(label, "at most 8 tags per entry");
    if (new Set(entry.tags.map((tag) => String(tag).toLowerCase())).size !== entry.tags.length) {
      fail(label, "tags must be unique");
    }
  }

  if (entry.transport !== undefined) {
    if (!Array.isArray(entry.transport) || entry.transport.length === 0) {
      fail(label, "transport must be a non-empty array when present");
    } else {
      for (const transport of entry.transport) {
        if (!TRANSPORTS.has(transport)) {
          fail(label, `transport "${transport}" must be one of ${[...TRANSPORTS].join(", ")}`);
        }
      }
    }
  }

  if (entry.language !== undefined && !isNonEmptyString(entry.language)) {
    fail(label, "language must be a non-empty string when present");
  }

  if (entry.homepage !== undefined && !isHttpsUrl(entry.homepage)) {
    fail(label, "homepage must be an https:// URL when present");
  }

  if (entry.install !== undefined) {
    if (!isNonEmptyString(entry.install)) {
      fail(label, "install must be a non-empty string when present");
    } else if (entry.install.length > 240) {
      fail(label, "install must be 240 characters or fewer");
    }
  }
}

// --- cross checks ----------------------------------------------------------

for (const category of categories.values()) {
  const used = (data.entries ?? []).filter((entry) => entry?.category === category.id).length;
  if (used === 0) warn(`categories["${category.id}"]`, "declared but has no entries");
}

if (Array.isArray(data.entries)) {
  const sorted = [...data.entries].sort((a, b) => compare(a.id, b.id));
  if (data.entries.some((entry, index) => entry.id !== sorted[index].id)) {
    warn("entries", "are not sorted by id (run `npm run build` to regenerate docs in id order)");
  }
}

// --- report ----------------------------------------------------------------

const entryCount = Array.isArray(data.entries) ? data.entries.length : 0;
for (const message of warnings) console.warn(`warning  ${message}`);

if (problems.length > 0) {
  for (const message of problems) console.error(`error  ${message}`);
  console.error(`\nmcp-index: ${problems.length} problem(s) in ${entryCount} entries.`);
  process.exit(1);
}

console.log(
  `mcp-index: ${entryCount} entries, ${categories.size} categories — all checks passed${
    warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"})` : ""
  }.`,
);
