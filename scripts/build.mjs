#!/usr/bin/env node
// Renders README.md and INDEX.md from data/servers.json.
// `node scripts/build.mjs` writes the files; `--check` fails when they are out of date.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "servers.json");
const check = process.argv.includes("--check");

const KIND_LABEL = {
  server: "server",
  client: "client",
  framework: "framework",
  tool: "tool",
  registry: "registry",
};

// Code-point comparison keeps the rendered order identical on every Node version and locale.
const compare = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

const data = JSON.parse(await readFile(dataPath, "utf8"));
const entries = [...data.entries].sort((a, b) => compare(a.id, b.id));
const categories = [...data.categories];
const byCategory = new Map(categories.map((category) => [category.id, []]));
for (const entry of entries) byCategory.get(entry.category)?.push(entry);

const total = entries.length;
const officialCount = entries.filter((entry) => entry.official).length;
const repoUrl = (entry) => `https://github.com/${entry.repo}`;

function anchor(category) {
  return category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function entryRow(entry) {
  const name = `[${cell(entry.name)}](${repoUrl(entry)})${entry.official ? " ![official](https://img.shields.io/badge/official-2f6f4f)" : ""}`;
  const language = entry.language ? `\`${cell(entry.language)}\`` : "—";
  const tags = entry.tags.map((tag) => `\`${tag}\``).join(" ");
  return `| ${name} | ${cell(entry.description)} | ${language} | ${tags} |`;
}

function counts(category) {
  const list = byCategory.get(category.id) ?? [];
  return list.length;
}

function readme() {
  const lines = [];
  lines.push("# MCP Index");
  lines.push("");
  lines.push(
    "A curated, machine-readable index of **Model Context Protocol (MCP) servers, clients, frameworks and tools**.",
  );
  lines.push("");
  lines.push(
    `[![entries](https://img.shields.io/badge/entries-${total}-2f6f4f)](data/servers.json) ` +
      `[![official](https://img.shields.io/badge/official-${officialCount}-2f6f4f)](#legend) ` +
      "[![license](https://img.shields.io/badge/license-MIT-2f6f4f)](LICENSE) " +
      "[![CI](https://github.com/humle93/mcp-index/actions/workflows/ci.yml/badge.svg)](https://github.com/humle93/mcp-index/actions/workflows/ci.yml)",
  );
  lines.push("");
  lines.push(
    "Every entry is one object in [`data/servers.json`](data/servers.json). The tables below are generated from it, " +
      "so the JSON is the only place to edit and nothing in the docs can drift.",
  );
  lines.push("");
  lines.push("## Use the index");
  lines.push("");
  lines.push("```bash");
  lines.push("# list every server and its repository");
  lines.push("jq -r '.entries[] | select(.kind==\"server\") | \"\\(.name)\\t\\(.repo)\"' data/servers.json");
  lines.push("");
  lines.push("# filter by tags (e.g. everything that touches databases)");
  lines.push("jq -r '.entries[] | select(.tags | index(\"database\")) | \"\\(.name) — \\(.description)\"' data/servers.json");
  lines.push("");
  lines.push("# print install commands that ship with an entry");
  lines.push("jq -r '.entries[] | select(.install) | \"# \\(.name)\\n\\(.install)\\n\"' data/servers.json");
  lines.push("```");
  lines.push("");
  lines.push("Each entry has this shape (see [`schema/index.schema.json`](schema/index.schema.json)):");
  lines.push("");
  lines.push("```json");
  lines.push("{");
  lines.push('  "id": "github-mcp-server",');
  lines.push('  "name": "GitHub MCP Server",');
  lines.push('  "repo": "github/github-mcp-server",');
  lines.push('  "category": "developer-platforms",');
  lines.push('  "kind": "server",');
  lines.push('  "description": "GitHub\'s official server for repositories, issues, pull requests and actions.",');
  lines.push('  "official": true,');
  lines.push('  "language": "Go",');
  lines.push('  "transport": ["stdio", "http"],');
  lines.push('  "tags": ["git", "issues", "pull-requests"],');
  lines.push('  "install": "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server"');
  lines.push("}");
  lines.push("```");
  lines.push("");
  lines.push("## Contents");
  lines.push("");
  for (const category of categories) {
    lines.push(`- [${category.title}](#${anchor(category)}) — ${counts(category)}`);
  }
  lines.push(`- [Legend](#legend)`);
  lines.push(`- [Contributing](#contributing)`);
  lines.push("");
  for (const category of categories) {
    lines.push(`## ${category.title}`);
    lines.push("");
    lines.push(category.blurb);
    lines.push("");
    lines.push("| Project | What it does | Language | Tags |");
    lines.push("| --- | --- | --- | --- |");
    for (const entry of byCategory.get(category.id) ?? []) lines.push(entryRow(entry));
    lines.push("");
  }
  lines.push("## Legend");
  lines.push("");
  lines.push(
    "- **official** — published by the vendor or project team that owns the product or protocol, " +
      "as opposed to a third-party wrapper around its API.",
  );
  lines.push(
    `- **kind** — \`server\` exposes tools over MCP, \`client\` consumes them, \`framework\` is used to build either, ` +
      `\`tool\` is a helper around MCP, \`registry\` is a catalog or discovery service.`,
  );
  lines.push(
    "- **language** — the main implementation language of the repository, used to filter what you can debug locally.",
  );
  lines.push("");
  lines.push("## Contributing");
  lines.push("");
  lines.push(
    "Add or fix one object in [`data/servers.json`](data/servers.json), run `npm run check`, and open a pull request. " +
      "[`CONTRIBUTING.md`](CONTRIBUTING.md) has the field rules and the review criteria (active project, " +
      "working install, no dead links).",
  );
  lines.push("");
  lines.push(`_Generated from \`data/servers.json\` (last reviewed ${data.updated}). Do not edit the tables by hand._`);
  lines.push("");
  return lines.join("\n");
}

function index() {
  const lines = [];
  lines.push("# Index — every entry");
  lines.push("");
  lines.push(
    `All ${total} entries, A–Z. Generated from [\`data/servers.json\`](data/servers.json); see the ` +
      "[README](README.md) for categories and descriptions.",
  );
  lines.push("");
  lines.push("| Project | Kind | Category | Repository | Language |");
  lines.push("| --- | --- | --- | --- | --- |");
  const titleById = new Map(categories.map((category) => [category.id, category.title]));
  for (const entry of [...entries].sort((a, b) => compare(a.name, b.name))) {
    lines.push(
      `| ${cell(entry.name)} | ${KIND_LABEL[entry.kind] ?? entry.kind} | ${titleById.get(entry.category) ?? entry.category} | ` +
        `[${entry.repo}](${repoUrl(entry)}) | ${entry.language ? cell(entry.language) : "—"} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

const outputs = [
  ["README.md", readme()],
  ["INDEX.md", index()],
];

let drifted = [];
for (const [file, content] of outputs) {
  const path = join(root, file);
  let current = null;
  try {
    current = await readFile(path, "utf8");
  } catch {
    current = null;
  }
  if (current === content) continue;
  if (check) {
    drifted.push(file);
    continue;
  }
  await writeFile(path, content, "utf8");
  console.log(`mcp-index: wrote ${file}`);
}

if (check && drifted.length > 0) {
  console.error(
    `mcp-index: ${drifted.join(", ")} out of date — run \`npm run build\` and commit the result.`,
  );
  process.exit(1);
}

if (!check) console.log(`mcp-index: ${total} entries rendered.`);
