# Contributing

Thanks for helping keep this index useful. It exists to answer one question quickly: *which MCP server or tool should I use for this job?*

## The one rule

**`data/servers.json` is the source of truth.** `README.md` and `INDEX.md` are generated from it. Never edit the tables in the Markdown files — a CI job (`node scripts/build.mjs --check`) fails when the docs and the JSON disagree.

```bash
npm run validate   # field-level checks
npm run build      # regenerate README.md and INDEX.md
npm run check      # both, plus "are the generated files up to date?"
```

Node 18 or newer is all you need; there are no dependencies to install.

### Finding and adding entries

Three more commands make the index usable without reading JSON by hand. Each one takes flags;
add `--help` to any of them for the full list.

```bash
npm run find -- --tag database          # search by tag, kind, category, language or text
npm run find -- --list tags             # the tags in use, and how often
npm run add -- --repo acme/acme-mcp --category databases-and-storage \
    --description "Queries Acme tables and inspects schemas from an agent." \
    --official true --tag database --tag sql
npm run verify -- --limit 5             # check that repositories still exist
```

`npm run add` checks the repository on GitHub, inserts the object in `id` order without
reformatting the rest of the file, bumps `updated`, and reverts everything if validation fails.
`--official` has no default: only a human can decide whether a project is maintained by the
vendor it talks to. `npm run verify` needs `GITHUB_TOKEN` to check every entry, because 117
requests exceed the unauthenticated limit; [`ROADMAP.md`](ROADMAP.md) has the details of all
three.

## Adding an entry

1. Add one object to `entries` in [`data/servers.json`](data/servers.json), keeping the array sorted by `id`.
2. Set `updated` in the same file to today's date.
3. Run `npm run check` and fix anything it reports.
4. Commit the JSON **and** the regenerated Markdown, then open a pull request.

```json
{
  "id": "my-server",
  "name": "My Server",
  "repo": "owner/my-server",
  "category": "databases",
  "kind": "server",
  "description": "What it gives an agent, in one sentence, ending with a period.",
  "official": false,
  "language": "Python",
  "transport": ["stdio"],
  "tags": ["postgres", "sql"],
  "install": "uvx my-server"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique, lower-kebab-case, stable. Renaming it breaks inbound links. |
| `name` | yes | Display name, ≤ 60 characters. |
| `repo` | yes | `owner/name` on GitHub, the canonical repository (not a fork or a mirror). |
| `category` | yes | Must exist in `categories[]`. Propose a new category in the pull request if nothing fits. |
| `kind` | yes | `server`, `client`, `framework`, `tool` or `registry`. |
| `description` | yes | 12–200 characters, one sentence, factual. Say what the tools *do*, not that it "revolutionises workflows". |
| `official` | yes | `true` only when the vendor or project the server talks to maintains it. Third-party wrappers are `false`. |
| `tags` | yes | 1–8 lower-kebab-case tags used for filtering. |
| `language` | no | Main implementation language of the repository. |
| `transport` | no | Any of `stdio`, `http`, `sse`, `websocket`. |
| `homepage` | no | `https://` documentation or product page. |
| `install` | no | A copy-pasteable command, ≤ 240 characters. |

## Review criteria

An entry is merged when all of these hold:

- **The repository exists and is public** — the table links straight to it, so a dead link is a bug.
- **It is actually MCP.** A tool that mentions MCP in its README but does not ship a server, client, SDK or MCP-aware helper is out.
- **It is maintained.** No archive banner, no "last commit three years ago" for something claiming current protocol support.
- **It is not a duplicate.** One entry per repository, and one repository per entry. If a project ships several servers, pick the repository that documents them together.
- **The description is honest.** No superlatives, no unverified claims, no marketing copy.
- **Scope fits.** This index lists MCP servers, clients, frameworks, tools and registries. It does not list prompt libraries, ordinary AI SDKs, or agent products that merely *consume* MCP without exposing it.

### What counts as evidence

"Maintained" is the criterion that gets argued about, so a new entry only goes in once four facts were
read off GitHub's own repository metadata — not off a README's tone, and not off a star count:

| Fact | Where it comes from | Why that source alone is not enough |
| --- | --- | --- |
| the repository is public, enabled and still called that | `archived`, `disabled`, `full_name` from `GET /repos/{owner}/{repo}` | a redirect hides a rename; a fork looks alive |
| it has been touched recently | `pushed_at` from the same response | a green CI badge can be a bot bumping a lockfile |
| it really is MCP | the README or docs showing a server, a client, an SDK or an MCP-aware helper | plenty of projects only mention MCP in passing |
| the vendor maintains it | the repository lives under the vendor's own org **and** the README says so | a vendor org also hosts thin wrappers and experiments |

`GET /repos/{owner}/{repo}` answers all of it in one request:

```bash
curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/name \
  | jq '{full_name, archived, disabled, pushed_at, language, description}'
```

`npm run verify` does the same for every entry at once and writes `reports/health.json`.
If the unauthenticated limit blocks it (60 requests an hour against 117 entries, which returns
`403`), repeat the check with a token before merging and say in the pull request which credential
produced it. **A rate-limit warning is not a pass.**

Two more fields have to be judged rather than looked up, and both are easy to get wrong:

- **`kind` is what the repository ships, not who publishes it.** `Airtable/airtable-mcp-cli` is
  vendor-maintained and in the index as `tool`, because it discovers the tools of
  `mcp.airtable.com` at runtime instead of serving them itself.
- **`language` is the implementation of the repository**, as reported by GitHub. Leave it out when
  the project has no single main language rather than guessing from a file extension.

Put the evidence in the pull request: the repository, its `pushed_at` date, and the one sentence
that shows it is MCP. Reviewing a batch is then a matter of reading four lines per entry.

### How recent is recent

`npm run verify` only warns after 548 days without a push (`--stale-days`), which is deliberately
lenient for entries that are already in the index. New entries hold a stricter line: a push within
roughly the last year. Anything older needs its own reason in the pull request — a release, a
commit on the default branch, or a maintainer answering issues. In the batch that filled the
thinnest categories the oldest accepted entry was `paypal/paypal-mcp-server`, pushed 2025-10-28
against a 2026-11-06 review date; every other entry had been pushed in the previous two weeks.
That margin is why the date belongs in the pull request instead of in someone's memory.

### Cases that have been rejected in practice

Real examples from the batch that filled the thinnest categories. They are here because each one
looks like a good entry until you check it.

| Situation | Example | What the check showed | Outcome |
| --- | --- | --- | --- |
| Archived upstream | `digitalocean/digitalocean-mcp`, `browserbase/mcp-server-browserbase` | `archived: true` — the vendor's own successor or replacement story is unfinished | Out. `npm run verify` treats `archived` as an error, not a warning, so an entry that is archived on arrival would turn the weekly run red. |
| Unmaintained by its own admission | `Unstructured-IO/UNS-MCP` | README: "It is not actively maintained and is kept here for reference" | Out. A README that says this outranks any recent commit; do not add a project the maintainer has parked. |
| The slug was a guess | `pulumi/mcp-server`, `Shopify/dev-mcp`, `milvus-io/mcp-server-milvus` | `404` from the API | Out — but the `404` is about the guess, not the project. Find the canonical repository first, then judge it. |
| Hosted service, no canonical repository | Asana's server at `mcp.asana.com`; `Asana/command-mcp` | the org repo has no description and single-digit stars, and the hosted server has no repository to link | Out for now. An entry needs a repository a reader can open; a hosted endpoint with no source does not fit the table. |
| A wrapper with nothing of its own | `box/mcp-server-box-remote` | a few kilobytes of code, last push 2025-09 | Out. If the repository is a thin adapter, the vendor's real server belongs in the index instead. |
| Already listed under another name | `chroma-core/chroma-mcp`, `qdrant/mcp-server-qdrant` | both repos are already entries | Out. Check `npm run find -- --text <name>` before proposing something new. |

Two patterns from that table are worth stating as rules:

- **Archived and self-declared-unmaintained projects are rejected outright**, regardless of how
  popular or well documented they are. Popularity is not maintenance.
- **"Official" is not a substitute for evidence.** An entry marked `official: true` needs a
  repository under the vendor's org that a reader can open — a vendor-hosted endpoint with no
  repository is not enough to list.

## Removing or correcting an entry

Same file, same command. Archive the removal reason in the pull request: dead repository, renamed project (link the new one), archived upstream, or no longer MCP. If a project moved, update `repo` and keep the `id` so links keep working.

## Reporting a problem without a pull request

Open an issue with the entry's `id` in the title. Broken links, wrong `official` flags and stale descriptions are all welcome as issues — they are easy to fix and hard to notice.

## Licensing

By contributing you agree that your additions are released under the [MIT License](LICENSE) that covers this repository. Entries only link to other projects; they claim no rights over them.
