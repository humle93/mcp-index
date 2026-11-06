#!/usr/bin/env node
// Checks every repository in data/servers.json against GitHub, so that a dead, renamed or
// archived project is found by a scheduled run instead of by a reader who clicked the link.
//
//   node scripts/verify.mjs                 # every entry (106 requests)
//   node scripts/verify.mjs --limit 10      # first 10, for a quick local check
//   node scripts/verify.mjs --only github-mcp-server
//   node scripts/verify.mjs --no-report     # skip reports/health.json
//
// Exit codes: 0 = clean, 1 = a repository is missing, renamed, archived or disabled,
// 2 = the check could not run at all (dataset unreadable, rate limit reached).
//
// Set GITHUB_TOKEN to stay inside the API limit: unauthenticated calls are capped at 60 per
// hour, which is less than the dataset needs. CI supplies the workflow token automatically.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "servers.json");
const reportPath = join(root, "reports", "health.json");

const CONCURRENCY = 4;
const STALE_DAYS = 548; // ~18 months without a push is a warning, not an error

const PROBLEM_STATES = new Set(["missing", "renamed", "archived", "disabled", "error"]);

function parseArgs(argv) {
  const options = { limit: Infinity, only: null, report: true, staleDays: STALE_DAYS };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      index += 1;
      return next;
    };

    switch (arg) {
      case "--limit":
        options.limit = Number(value());
        if (!Number.isInteger(options.limit) || options.limit < 1) throw new Error("--limit must be a positive integer");
        break;
      case "--only":
        options.only = value();
        break;
      case "--stale-days":
        options.staleDays = Number(value());
        if (!Number.isInteger(options.staleDays) || options.staleDays < 1) throw new Error("--stale-days must be a positive integer");
        break;
      case "--no-report":
        options.report = false;
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

const help = `Usage: node scripts/verify.mjs [options]

Checks every repository in data/servers.json against the GitHub API.

Options:
  --limit <n>        only check the first n entries
  --only <id>        only check one entry by id
  --stale-days <n>   warn when a repository has not been pushed to in n days (default ${STALE_DAYS})
  --no-report        do not write reports/health.json
  -h, --help         show this help

Environment:
  GITHUB_TOKEN or GH_TOKEN   raises the API limit from 60 to 5000 requests per hour

Exit codes: 0 clean, 1 problems found, 2 the check could not run.`;

function daysSince(isoDate) {
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) return 0;
  return (Date.now() - then) / 86_400_000;
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

function buildHeaders(token) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "mcp-index-verify (+https://github.com/humle93/mcp-index)",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function checkEntry(entry, { headers, staleDays }) {
  const record = {
    id: entry.id,
    repo: entry.repo,
    state: "ok",
    detail: null,
    full_name: null,
    archived: false,
    pushed_at: null,
    default_branch: null,
    checked_at: new Date().toISOString(),
  };

  let response;
  try {
    response = await fetch(`https://api.github.com/repos/${entry.repo}`, { headers });
  } catch (error) {
    return { ...record, state: "error", detail: `request failed: ${error.message}` };
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  if ((response.status === 403 || response.status === 429) && remaining === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const at = reset ? new Date(reset).toISOString() : "soon";
    const error = new Error(`GitHub API rate limit reached; the limit resets at ${at}. Set GITHUB_TOKEN.`);
    error.fatal = true;
    throw error;
  }

  if (response.status === 404) {
    return { ...record, state: "missing", detail: "404 — deleted, renamed without a redirect, or private" };
  }
  if (!response.ok) {
    return { ...record, state: "error", detail: `HTTP ${response.status} ${response.statusText}`.trim() };
  }

  const repo = await response.json();
  record.full_name = repo.full_name ?? null;
  record.archived = Boolean(repo.archived);
  record.pushed_at = repo.pushed_at ?? null;
  record.default_branch = repo.default_branch ?? null;

  if (repo.archived) return { ...record, state: "archived", detail: "repository is archived" };
  if (repo.disabled) return { ...record, state: "disabled", detail: "repository is disabled" };

  if (record.full_name && record.full_name.toLowerCase() !== entry.repo.toLowerCase()) {
    return { ...record, state: "renamed", detail: `now ${record.full_name} — update the entry` };
  }

  if (record.pushed_at && daysSince(record.pushed_at) > staleDays) {
    const date = record.pushed_at.slice(0, 10);
    return { ...record, state: "stale", detail: `no push since ${date}` };
  }

  return record;
}

function renderSummary(checked, problems, warnings) {
  const lines = [
    "## Repository health",
    "",
    `${checked} repositories checked · ${problems.length} problem${problems.length === 1 ? "" : "s"} · ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`,
  ];

  if (problems.length > 0) {
    lines.push("", "| Entry | Repository | Problem |", "| --- | --- | --- |");
    for (const item of problems) lines.push(`| \`${item.id}\` | ${item.repo} | ${item.detail} |`);
  }
  if (warnings.length > 0) {
    lines.push("", "| Entry | Repository | Warning |", "| --- | --- | --- |");
    for (const item of warnings) lines.push(`| \`${item.id}\` | ${item.repo} | ${item.detail} |`);
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`mcp-index verify: ${error.message}`);
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
    console.error(`mcp-index verify: cannot read data/servers.json — ${error.message}`);
    return 2;
  }

  const all = Array.isArray(data.entries) ? data.entries : [];
  let entries = all;
  if (options.only) {
    entries = all.filter((entry) => entry.id === options.only);
    if (entries.length === 0) {
      console.error(`mcp-index verify: no entry with id "${options.only}"`);
      return 2;
    }
  }
  entries = entries.slice(0, options.limit === Infinity ? entries.length : options.limit);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token && entries.length > 55) {
    console.warn("warning  no GITHUB_TOKEN set; unauthenticated runs are limited to 60 requests per hour");
  }

  const headers = buildHeaders(token);
  let results;
  try {
    results = await pool(entries, (entry) => checkEntry(entry, { headers, staleDays: options.staleDays }), CONCURRENCY);
  } catch (error) {
    console.error(`mcp-index verify: ${error.message}`);
    return 2;
  }

  const problems = results.filter((item) => PROBLEM_STATES.has(item.state));
  const warnings = results.filter((item) => item.state === "stale");

  for (const item of problems) console.error(`error    ${item.id}  ${item.repo} — ${item.detail}`);
  for (const item of warnings) console.warn(`warning  ${item.id}  ${item.repo} — ${item.detail}`);

  const summary = renderSummary(results.length, problems, warnings);

  if (options.report) {
    try {
      await mkdir(dirname(reportPath), { recursive: true });
      const report = {
        generated_at: new Date().toISOString(),
        authenticated: Boolean(token),
        checked: results.length,
        problems: problems.length,
        warnings: warnings.length,
        results,
      };
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    } catch (error) {
      console.warn(`warning  could not write reports/health.json — ${error.message}`);
    }
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      const { appendFile } = await import("node:fs/promises");
      await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
    } catch (error) {
      console.warn(`warning  could not write the CI summary — ${error.message}`);
    }
  }

  console.log(
    `mcp-index: ${results.length} of ${all.length} repositories checked — ${problems.length} problem${
      problems.length === 1 ? "" : "s"
    }, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
  );

  return problems.length > 0 ? 1 : 0;
}

process.exit(await main());
