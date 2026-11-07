#!/usr/bin/env node
// Scaffolds one entry, so contributing is a command instead of hand-editing JSON in the right
// order and hoping the indentation matches.
//
//   node scripts/add.mjs --repo acme/acme-mcp --category databases-and-storage \
//       --description "Queries Acme tables and inspects schemas from an agent." \
//       --official true --tag database --tag sql
//
// It reads the repository from GitHub to check that it exists and is neither archived nor disabled,
// and to fill in the language, then inserts the object in id order, bumps "updated", validates,
// regenerates README.md and INDEX.md, and reverts everything if any of that fails.
//
// Use --dry-run to see the object without writing.

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "servers.json");

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/;
const TAG_RE = /^[a-z0-9]+(?:[.+-][a-z0-9]+)*$/;
const KINDS = new Set(["server", "client", "framework", "tool", "registry"]);
const TRANSPORTS = new Set(["stdio", "http", "sse", "websocket"]);

const help = `Usage: node scripts/add.mjs --repo <owner/name> --category <id> --description "<sentence>" --official <true|false> [options]

Required:
  --repo <owner/name>    canonical GitHub repository
  --category <id>        must already exist in data/servers.json
  --description "<text>" 12-200 characters, one factual sentence ending with a period
  --official <bool>      true only when the vendor or project itself maintains it

Optional:
  --id <id>              default: derived from the repository name
  --name <name>          default: the repository name
  --kind <kind>          server (default) | client | framework | tool | registry
  --tag <tag>            repeatable; one to eight tags
  --language <name>      default: read from GitHub
  --transport <name>     repeatable; stdio, http, sse, websocket
  --install "<command>"  copy-pasteable install or run command
  --homepage <url>       https:// documentation or product page
  --dry-run              print the object without writing anything

Environment:
  GITHUB_TOKEN or GH_TOKEN   optional; avoids the unauthenticated 60 requests per hour limit
`;

function fail(message) {
  console.error(`mcp-index add: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { tags: [], transport: [], official: null, dryRun: false };
  const single = {
    "--repo": "repo",
    "--category": "category",
    "--description": "description",
    "--id": "id",
    "--name": "name",
    "--kind": "kind",
    "--language": "language",
    "--install": "install",
    "--homepage": "homepage",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) fail(`${arg} needs a value`);
      index += 1;
      return next;
    };

    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--tag") {
      options.tags.push(...value().split(",").map((tag) => tag.trim()).filter(Boolean));
      continue;
    }
    if (arg === "--transport") {
      options.transport.push(...value().split(",").map((item) => item.trim()).filter(Boolean));
      continue;
    }
    if (arg === "--official") {
      const raw = value();
      if (raw !== "true" && raw !== "false") fail('--official must be "true" or "false"');
      options.official = raw === "true";
      continue;
    }
    if (!(arg in single)) fail(`unknown option ${arg}`);

    options[single[arg]] = value();
  }

  return options;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function arrayLiteral(values) {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function renderBlock(entry, { trailingComma }) {
  const fields = [];
  for (const key of ["id", "name", "repo", "category", "kind", "description"]) {
    fields.push([key, JSON.stringify(entry[key])]);
  }
  fields.push(["official", String(entry.official === true)]);
  if (entry.language) fields.push(["language", JSON.stringify(entry.language)]);
  if (entry.transport?.length) fields.push(["transport", arrayLiteral(entry.transport)]);
  fields.push(["tags", arrayLiteral(entry.tags)]);
  if (entry.install) fields.push(["install", JSON.stringify(entry.install)]);
  if (entry.homepage) fields.push(["homepage", JSON.stringify(entry.homepage)]);

  const lines = ["    {"];
  fields.forEach(([key, value], index) => {
    const comma = index === fields.length - 1 ? "" : ",";
    lines.push(`      ${JSON.stringify(key)}: ${value}${comma}`);
  });
  lines.push(`    }${trailingComma ? "," : ""}`);
  return lines;
}

async function repoMetadata(repo) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "mcp-index-add (+https://github.com/humle93/mcp-index)",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  } catch (error) {
    fail(`could not reach GitHub to check ${repo} — ${error.message}`);
  }

  if (response.status === 404) fail(`${repo} does not exist on GitHub (or is private)`);
  if (response.status === 403 || response.status === 429) {
    const body = await response.json().catch(() => null);
    const blocked = body?.block?.reason;
    // GitHub answers a blocked repository with 403 and a "block" object instead of 404: disabled,
    // DMCA takedown, or blocked by the owner. None of those can become an entry.
    if (blocked) {
      const why = blocked === "disabled" ? "; disabled repositories do not belong in the index" : "";
      fail(`${repo} is blocked on GitHub (${blocked})${why}`);
    }
    const rateLimited = response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0";
    if (rateLimited) {
      console.warn(
        `warning  GitHub API rate limit reached; the archived/disabled check for ${repo} did not run — set GITHUB_TOKEN and repeat before committing`,
      );
      return null;
    }
    fail(`GitHub answered ${response.status} for ${repo}${body?.message ? ` — ${body.message}` : ""}`);
  }
  if (!response.ok) fail(`GitHub answered ${response.status} for ${repo}`);

  const metadata = await response.json();
  if (metadata.archived) fail(`${repo} is archived; archived projects do not belong in the index`);
  if (metadata.disabled) fail(`${repo} is disabled; disabled repositories do not belong in the index`);
  if (metadata.full_name && metadata.full_name.toLowerCase() !== repo.toLowerCase()) {
    fail(`${repo} has moved to ${metadata.full_name}; use that instead`);
  }

  return metadata;
}

function insertEntry(raw, entry) {
  const lines = raw.split("\n");
  const entriesLine = lines.findIndex((value) => /^\s{2}"entries": \[$/.test(value));
  if (entriesLine === -1) fail("could not find the entries array in data/servers.json");

  const starts = [];
  for (let index = entriesLine + 1; index < lines.length; index += 1) {
    if (/^  \]$/.test(lines[index])) break;
    if (/^    \{$/.test(lines[index])) starts.push(index);
  }
  if (starts.length === 0) fail("the entries array is empty; insert the first entry by hand");

  const idOf = (start) => {
    const match = /^ {6}"id": "([^"]+)",$/.exec(lines[start + 1] ?? "");
    return match ? match[1] : "";
  };

  const before = starts.find((start) => idOf(start) > entry.id);

  if (before !== undefined) {
    lines.splice(before, 0, ...renderBlock(entry, { trailingComma: true }));
  } else {
    const lastStart = starts[starts.length - 1];
    const closing = lines.findIndex((value, index) => index > lastStart && /^    \}$/.test(value));
    if (closing === -1) fail("could not find the end of the last entry");
    lines[closing] = "    },";
    lines.splice(closing + 1, 0, ...renderBlock(entry, { trailingComma: false }));
  }

  const today = new Date().toISOString().slice(0, 10);
  const updated = lines.findIndex((value) => /^  "updated": "[^"]+",$/.test(value));
  if (updated === -1) fail('could not find the "updated" field');
  lines[updated] = `  "updated": "${today}",`;

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help);
    return 0;
  }

  if (!options.repo) fail("--repo is required");
  if (!REPO_RE.test(options.repo)) fail(`"${options.repo}" must look like owner/name`);
  if (!options.category) fail("--category is required");
  if (options.official === null) fail("--official true|false is required, because only a human can decide it");

  const raw = await readFile(dataPath, "utf8");
  const data = JSON.parse(raw);

  const categoryIds = new Set((data.categories ?? []).map((category) => category.id));
  if (!categoryIds.has(options.category)) {
    fail(`category "${options.category}" is not declared; existing ones: ${[...categoryIds].sort().join(", ")}`);
  }

  const metadata = await repoMetadata(options.repo);

  const id = slugify(options.id ?? options.repo.split("/")[1]);
  if (!ID_RE.test(id)) fail(`id "${id}" is not lower-kebab-case`);
  if ((data.entries ?? []).some((entry) => entry.id === id)) fail(`an entry with id "${id}" already exists`);
  if ((data.entries ?? []).some((entry) => entry.repo.toLowerCase() === options.repo.toLowerCase())) {
    fail(`${options.repo} is already in the index`);
  }

  const name = options.name ?? options.repo.split("/")[1];
  if (name.length > 60) fail("--name must be 60 characters or fewer");

  const description = options.description ?? String(metadata?.description ?? "").trim();
  if (!description) fail("--description is required (GitHub has no description to borrow)");
  if (description.length < 12 || description.length > 200) fail("--description must be 12-200 characters");
  if (!/[.!?]$/.test(description)) fail("--description must end with a period");

  const kind = options.kind ?? "server";
  if (!KINDS.has(kind)) fail(`--kind must be one of ${[...KINDS].join(", ")}`);

  const tags = options.tags.map(slugify).filter(Boolean);
  if (tags.length === 0) fail("at least one --tag is required");
  if (tags.length > 8) fail("at most 8 tags");
  for (const tag of tags) if (!TAG_RE.test(tag)) fail(`tag "${tag}" is not lower-kebab-case`);

  for (const transport of options.transport) {
    if (!TRANSPORTS.has(transport)) fail(`--transport must be one of ${[...TRANSPORTS].join(", ")}`);
  }

  if (options.homepage && !/^https:\/\//.test(options.homepage)) fail("--homepage must be an https:// URL");
  if (options.install && options.install.length > 240) fail("--install must be 240 characters or fewer");

  const entry = {
    id,
    name,
    repo: options.repo,
    category: options.category,
    kind,
    description,
    official: options.official,
    tags,
  };
  if (options.language ?? metadata?.language) entry.language = options.language ?? metadata.language;
  if (options.transport.length > 0) entry.transport = options.transport;
  if (options.install) entry.install = options.install;
  if (options.homepage) entry.homepage = options.homepage;

  const next = insertEntry(raw, entry);

  if (options.dryRun) {
    console.log(renderBlock(entry, { trailingComma: true }).join("\n"));
    return 0;
  }

  await writeFile(dataPath, next, "utf8");

  try {
    await run(process.execPath, [join(root, "scripts", "validate.mjs")], { cwd: root });
    await run(process.execPath, [join(root, "scripts", "build.mjs")], { cwd: root });
  } catch (error) {
    await writeFile(dataPath, raw, "utf8");
    fail(`the entry did not pass validation, so nothing was written:\n${error.stdout ?? ""}${error.stderr ?? ""}`);
  }

  console.log(`mcp-index add: inserted "${id}" and regenerated README.md and INDEX.md.`);
  console.log("Review the diff, then commit the dataset and both generated files together.");
  return 0;
}

process.exit(await main());
