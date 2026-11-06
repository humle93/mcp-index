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
vendor it talks to. `npm run verify` needs `GITHUB_TOKEN` to check every entry, because 106
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

## Removing or correcting an entry

Same file, same command. Archive the removal reason in the pull request: dead repository, renamed project (link the new one), archived upstream, or no longer MCP. If a project moved, update `repo` and keep the `id` so links keep working.

## Reporting a problem without a pull request

Open an issue with the entry's `id` in the title. Broken links, wrong `official` flags and stale descriptions are all welcome as issues — they are easy to fix and hard to notice.

## Licensing

By contributing you agree that your additions are released under the [MIT License](LICENSE) that covers this repository. Entries only link to other projects; they claim no rights over them.
