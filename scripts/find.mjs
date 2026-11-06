#!/usr/bin/env node
// Queries the index from a terminal, so finding a server does not require writing jq.
//
//   node scripts/find.mjs --tag database
//   node scripts/find.mjs --kind server --official --search postgres
//   node scripts/find.mjs --category clients-and-hosts
//   node scripts/find.mjs --json --tag memory > memory.json
//   node scripts/find.mjs --list tags
//
// Filters combine with AND; a tag may be given more than once and every one must be present.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "servers.json");

const help = `Usage: node scripts/find.mjs [options]

Searches data/servers.json. With no options it lists every entry.

Options:
  --tag <tag>          require a tag (repeatable; all given tags must be present)
  --kind <kind>        server | client | framework | tool | registry
  --category <id>      category id, e.g. databases-and-storage
  --language <name>    implementation language, e.g. Python
  --official           only entries maintained by the vendor or project
  --community          only third-party entries
  --search <text>      match text in name, description, repo or tags (case-insensitive)
  --limit <n>          stop after n matches
  --ids                print ids only
  --json               print the matching entries as JSON
  --list <what>        tags | categories | kinds | languages — print the values and counts
  -h, --help           show this help
`;

function parseArgs(argv) {
  const options = {
    tags: [],
    kind: null,
    category: null,
    language: null,
    official: null,
    search: null,
    limit: Infinity,
    ids: false,
    json: false,
    list: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      index += 1;
      return next;
    };

    switch (arg) {
      case "--tag":
        options.tags.push(...value().split(",").map((tag) => tag.trim()).filter(Boolean));
        break;
      case "--kind":
        options.kind = value();
        break;
      case "--category":
        options.category = value();
        break;
      case "--language":
        options.language = value();
        break;
      case "--official":
        options.official = true;
        break;
      case "--community":
        options.official = false;
        break;
      case "--search":
        options.search = value().toLowerCase();
        break;
      case "--limit":
        options.limit = Number(value());
        if (!Number.isInteger(options.limit) || options.limit < 1) throw new Error("--limit must be a positive integer");
        break;
      case "--ids":
        options.ids = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--list":
        options.list = value();
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      default:
        throw new Error(`unknown option ${arg}`);
    }
  }

  return options;
}

function matches(entry, options) {
  if (options.kind && entry.kind !== options.kind) return false;
  if (options.category && entry.category !== options.category) return false;
  if (options.language && String(entry.language ?? "").toLowerCase() !== options.language.toLowerCase()) return false;
  if (options.official !== null && Boolean(entry.official) !== options.official) return false;

  const tags = (entry.tags ?? []).map((tag) => String(tag).toLowerCase());
  if (options.tags.length > 0 && !options.tags.every((tag) => tags.includes(tag.toLowerCase()))) return false;

  if (options.search) {
    const haystack = [entry.id, entry.name, entry.repo, entry.description, tags.join(" ")]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(options.search)) return false;
  }

  return true;
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

function printLists(data, what) {
  const entries = data.entries ?? [];
  let rows;
  switch (what) {
    case "tags":
      rows = countBy(entries.flatMap((entry) => entry.tags ?? []));
      break;
    case "categories":
      rows = (data.categories ?? []).map((category) => [category.id, entries.filter((entry) => entry.category === category.id).length]);
      break;
    case "kinds":
      rows = countBy(entries.map((entry) => entry.kind));
      break;
    case "languages":
      rows = countBy(entries.map((entry) => entry.language));
      break;
    default:
      throw new Error(`--list needs one of tags, categories, kinds, languages (got "${what}")`);
  }

  const width = Math.max(...rows.map(([name]) => name.length), 1);
  for (const [name, count] of rows) {
    console.log(`${name.padEnd(width)}  ${String(count).padStart(4)}`);
  }
}

function printEntry(entry) {
  const facts = [entry.repo, entry.kind, entry.category];
  if (entry.language) facts.push(entry.language);
  console.log(`${entry.name} — ${entry.description}`);
  console.log(`    ${facts.join(" · ")}`);
  if (entry.install) console.log(`    ${entry.install}`);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`mcp-index find: ${error.message}`);
    console.error("Run with --help for the options.");
    return 2;
  }

  if (options.help) {
    console.log(help);
    return 0;
  }

  let data;
  try {
    data = JSON.parse(await readFile(dataPath, "utf8"));
  } catch (error) {
    console.error(`mcp-index find: cannot read data/servers.json — ${error.message}`);
    return 2;
  }

  if (options.list) {
    try {
      printLists(data, options.list);
      return 0;
    } catch (error) {
      console.error(`mcp-index find: ${error.message}`);
      return 2;
    }
  }

  const hits = (data.entries ?? []).filter((entry) => matches(entry, options));
  const limited = options.limit === Infinity ? hits : hits.slice(0, options.limit);

  if (options.json) {
    console.log(JSON.stringify(limited, null, 2));
    return 0;
  }

  if (options.ids) {
    for (const entry of limited) console.log(entry.id);
    return 0;
  }

  if (limited.length === 0) {
    console.error("mcp-index find: no entry matches those filters.");
    return 1;
  }

  for (const entry of limited) printEntry(entry);
  if (limited.length < hits.length) {
    console.error(`\n${limited.length} of ${hits.length} matches shown (--limit).`);
  } else if (hits.length > 3) {
    console.error(`\n${hits.length} matches.`);
  }

  return 0;
}

process.exit(await main());
