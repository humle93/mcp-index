# Roadmap

_Last updated 2026-11-06 · every stage below is measured on `main`, not announced._

The content side is finished: 106 entries, 93 of them official, validated field by field and
generated from one source of truth. What was left is not curation — it is the three things a
curated index needs in order to stay worth reading: it has to notice when a repository dies, it
has to be quick to query, and it has to be cheap to extend.

| Stage | What | Effort | Status |
| --- | --- | --- | --- |
| R1 | Repository health check | 2.0 h | done |
| R2 | Query from the terminal | 1.0 h | done |
| R3 | One-command entry scaffold | 1.5 h | done |
| R4 | Wiring, docs and CI | 1.5 h | done |
| **Total** | | **6.0 h** | **6.0 of 6.0 h (100 %)** |

## R1 — Repository health check (2.0 h, done)

`node scripts/verify.mjs` asks the GitHub API about every `repo` in the dataset and reports what
the dataset cannot know by itself:

| State | Meaning |
| --- | --- |
| `missing` | 404 — deleted, renamed without a redirect, or made private |
| `renamed` | the repository now lives at another `full_name` |
| `archived` | an archive banner is the one thing a reader cannot see from a table |
| `disabled` | GitHub has disabled the repository |
| `stale` | no push in 18 months (a warning, not a failure) |

Exit codes: `0` clean, `1` at least one problem, `2` the check could not run (unreadable dataset,
rate limit). A full run costs 106 API calls, so the script reads `x-ratelimit-remaining` and stops
with the reset time rather than guessing when the limit is gone. It writes `reports/health.json`
(git-ignored) and appends a table to `$GITHUB_STEP_SUMMARY` when CI provides one.

`.github/workflows/verify.yml` runs it every Monday at 06:00 UTC and on demand, so a dead link
becomes a red scheduled run instead of slow rot. For a quick local check without a token:
`node scripts/verify.mjs --limit 5`.

## R2 — Query from the terminal (1.0 h, done)

`node scripts/find.mjs` filters the dataset without a jq expression:

```bash
node scripts/find.mjs --tag database
node scripts/find.mjs --kind server --official --search postgres
node scripts/find.mjs --category clients-and-hosts
node scripts/find.mjs --json --tag memory > memory.json
node scripts/find.mjs --list tags
```

Filters combine with AND, `--tag` is repeatable, and `--list` prints tag, category, kind and
language counts — which is how the thin corners of the index stay visible.

## R3 — One-command entry scaffold (1.5 h, done)

`node scripts/add.mjs` turns "add a project" into one command. It checks the repository exists,
is not archived and has not been renamed, reads its language, inserts the object in id order
without reformatting the rest of the file, bumps `updated`, then runs validation and the doc
generator — and rewrites the original file if any of that fails.

```bash
node scripts/add.mjs --repo acme/acme-mcp --category databases-and-storage \
    --description "Queries Acme tables and inspects schemas from an agent." \
    --official true --tag database --tag sql
```

`--official` has no default on purpose: whether a project is maintained by the vendor or by a
third party is a judgement about the project, not something a script can read off the API.
`--dry-run` prints the object instead of writing it.

## R4 — Wiring, docs and CI (1.5 h, done)

`package.json` exposes the commands as `npm run find`, `npm run add` and `npm run verify`;
`CONTRIBUTING.md` documents them next to `npm run check`; `reports/` is git-ignored so a local
run cannot dirty the tree. `npm run check` is unchanged and still the gate for a pull request:
field validation plus "do the generated files match the dataset?".

## Deliberately not on this roadmap

- **A hosted website.** The JSON is the API and the generated Markdown is the human view; a
  static catalogue would need GitHub Pages enabled by the owner before it could be published,
  and it would duplicate what `README.md` already renders.
- **Re-curating the 106 entries.** The content was verified entry by entry; changes should come
  from the health check, from issues and from pull requests, not from a second pass over the
  same list.
