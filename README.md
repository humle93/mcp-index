# MCP Index

A curated, machine-readable index of **Model Context Protocol (MCP) servers, clients, frameworks and tools**.

[![entries](https://img.shields.io/badge/entries-106-2f6f4f)](data/servers.json) [![official](https://img.shields.io/badge/official-93-2f6f4f)](#legend) [![license](https://img.shields.io/badge/license-MIT-2f6f4f)](LICENSE) [![CI](https://github.com/humle93/mcp-index/actions/workflows/ci.yml/badge.svg)](https://github.com/humle93/mcp-index/actions/workflows/ci.yml)

Every entry is one object in [`data/servers.json`](data/servers.json). The tables below are generated from it, so the JSON is the only place to edit and nothing in the docs can drift.

## Use the index

```bash
# list every server and its repository
jq -r '.entries[] | select(.kind=="server") | "\\(.name)\\t\\(.repo)"' data/servers.json

# filter by tags (e.g. everything that touches databases)
jq -r '.entries[] | select(.tags | index("database")) | "\\(.name) — \\(.description)"' data/servers.json

# print install commands that ship with an entry
jq -r '.entries[] | select(.install) | "# \\(.name)\\n\\(.install)\\n"' data/servers.json
```

Each entry has this shape (see [`schema/index.schema.json`](schema/index.schema.json)):

```json
{
  "id": "github-mcp-server",
  "name": "GitHub MCP Server",
  "repo": "github/github-mcp-server",
  "category": "developer-platforms",
  "kind": "server",
  "description": "GitHub's official server for repositories, issues, pull requests and actions.",
  "official": true,
  "language": "Go",
  "transport": ["stdio", "http"],
  "tags": ["git", "issues", "pull-requests"],
  "install": "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server"
}
```

## Contents

- [Core protocol & reference](#core-protocol-reference) — 2
- [Frameworks & SDKs](#frameworks-sdks) — 15
- [Developer platforms & code](#developer-platforms-code) — 12
- [Databases & storage](#databases-storage) — 19
- [Cloud & infrastructure](#cloud-infrastructure) — 10
- [Web, search & browsers](#web-search-browsers) — 9
- [Productivity & business](#productivity-business) — 10
- [AI, models & retrieval](#ai-models-retrieval) — 5
- [Clients & hosts](#clients-hosts) — 14
- [Tools & utilities](#tools-utilities) — 10
- [Legend](#legend)
- [Contributing](#contributing)

## Core protocol & reference

The protocol's own repositories: canonical reference servers, the community registry, and the inspector you debug them with.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [MCP Registry](https://github.com/modelcontextprotocol/registry) ![official](https://img.shields.io/badge/official-2f6f4f) | The protocol's community registry service for publishing and discovering servers. | `Go` | `registry` `discovery` |
| [Reference Servers](https://github.com/modelcontextprotocol/servers) ![official](https://img.shields.io/badge/official-2f6f4f) | Canonical examples: filesystem, git, fetch, memory, time and a deliberately awkward test server. | `TypeScript` | `reference` `filesystem` `fetch` `git` |

## Frameworks & SDKs

Libraries for building an MCP server or client in your language, plus the frameworks that turn existing APIs into tools.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Cloudflare Workers MCP](https://github.com/cloudflare/workers-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Exposes a Cloudflare Worker's own functions as MCP tools for local clients. | `TypeScript` | `cloudflare` `workers` `json-rpc` |
| [MCP C# SDK](https://github.com/modelcontextprotocol/csharp-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official .NET SDK for MCP servers and clients, maintained with Microsoft. | `C#` | `sdk` `dotnet` |
| [FastAPI-MCP](https://github.com/tadata-org/fastapi_mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Exposes existing FastAPI endpoints as MCP tools without rewriting them. | `Python` | `fastapi` `python` `framework` |
| [FastMCP](https://github.com/PrefectHQ/fastmcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Python framework that keeps servers short to write, with auth, proxying and testing built in. | `Python` | `python` `framework` |
| [FastMCP (TypeScript)](https://github.com/punkpeye/fastmcp) ![official](https://img.shields.io/badge/official-2f6f4f) | TypeScript framework with decorators, sessions and auth for building MCP servers quickly. | `TypeScript` | `typescript` `framework` |
| [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official Go SDK for MCP servers and clients, maintained with Google. | `Go` | `sdk` `go` |
| [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official Java SDK for MCP, maintained with Spring AI. | `Java` | `sdk` `java` |
| [MCP Kotlin SDK](https://github.com/modelcontextprotocol/kotlin-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official Kotlin multiplatform SDK for MCP clients and servers. | `Kotlin` | `sdk` `kotlin` |
| [MCP Framework](https://github.com/QuantGeekDev/mcp-framework) ![official](https://img.shields.io/badge/official-2f6f4f) | Opinionated TypeScript framework that turns decorated classes into MCP tools. | `TypeScript` | `typescript` `framework` |
| [mcp-go](https://github.com/mark3labs/mcp-go) ![official](https://img.shields.io/badge/official-2f6f4f) | Go library for building MCP servers and clients outside the official SDKs. | `Go` | `go` `sdk` `library` |
| [MCP Handler](https://github.com/vercel-labs/mcp-handler) ![official](https://img.shields.io/badge/official-2f6f4f) | Vercel's adapter that mounts an MCP endpoint inside Next.js, Nuxt and SvelteKit apps. | `TypeScript` | `nextjs` `vercel` `http` |
| [mcp-use](https://github.com/mcp-use/mcp-use) ![official](https://img.shields.io/badge/official-2f6f4f) | Full-stack framework for MCP servers and apps, with a client that runs across hosts. | `TypeScript` | `typescript` `framework` `apps` |
| [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official Python SDK with decorator-based servers, client helpers and every transport. | `Python` | `sdk` `python` |
| [MCP Rust SDK](https://github.com/modelcontextprotocol/rust-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official Rust implementation of MCP servers and clients. | `Rust` | `sdk` `rust` |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) ![official](https://img.shields.io/badge/official-2f6f4f) | Official TypeScript SDK for servers and clients, including streamable HTTP. | `TypeScript` | `sdk` `typescript` |

## Developer platforms & code

Repositories, issues, design files and code intelligence — the servers a coding agent reaches for first.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Argo CD MCP](https://github.com/argoproj-labs/mcp-for-argocd) ![official](https://img.shields.io/badge/official-2f6f4f) | Inspects and manages Argo CD applications, projects and sync operations. | `TypeScript` | `argocd` `kubernetes` `gitops` |
| [Atlassian MCP Server](https://github.com/atlassian/atlassian-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Atlassian's remote server for Jira, Confluence, Compass and Bitbucket, authenticated with OAuth. | `JavaScript` | `jira` `confluence` `bitbucket` `oauth` |
| [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Builds a persistent graph of code, docs and infrastructure so agents can query it locally. | `C` | `code-intelligence` `knowledge-graph` |
| [Figma Context MCP](https://github.com/GLips/Figma-Context-MCP) | Gives agents condensed Figma file data so designs become working UI instead of guesses. | `TypeScript` | `figma` `design` `ui` |
| [GitHub MCP Server](https://github.com/github/github-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | GitHub's official server for repositories, issues, pull requests and Actions. | `Go` | `git` `issues` `pull-requests` |
| [GitLab MCP](https://github.com/zereight/gitlab-mcp) | Community server for GitLab merge requests, issues, pipelines and wikis. | `TypeScript` | `git` `ci` `issues` |
| [Jenkins MCP Server](https://github.com/jenkinsci/mcp-server-plugin) ![official](https://img.shields.io/badge/official-2f6f4f) | Jenkins plugin that publishes jobs, builds and logs as MCP tools over HTTP. | `Java` | `jenkins` `ci` `builds` |
| [Magic MCP](https://github.com/21st-dev/magic-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Generates UI components on request and drops them into the project. | `TypeScript` | `ui` `components` `design` |
| [Postman MCP Server](https://github.com/postmanlabs/postman-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Searches Postman collections, environments and OpenAPI specs and runs requests. | `TypeScript` | `api` `openapi` `testing` |
| [Serena](https://github.com/oraios/serena) ![official](https://img.shields.io/badge/official-2f6f4f) | Semantic code retrieval and editing on top of language servers, so agents edit by symbol. | `Python` | `code-intelligence` `refactoring` |
| [SonarQube MCP Server](https://github.com/SonarSource/sonarqube-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs SonarQube analyses and reads code quality findings from an agent. | `Java` | `code-quality` `static-analysis` `security` |
| [Square MCP Server](https://github.com/square/square-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Reads Square payments, orders, customers and catalog data. | `TypeScript` | `payments` `commerce` |

## Databases & storage

SQL, document, graph and vector stores, with the servers that query and administer them.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Chroma MCP](https://github.com/chroma-core/chroma-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Vector search and collection management against local or hosted Chroma instances. | `Python` | `vector-database` `embeddings` |
| [ClickHouse MCP](https://github.com/ClickHouse/mcp-clickhouse) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs read-only SQL against ClickHouse and lets an agent browse schemas first. | `Python` | `sql` `analytics` |
| [Couchbase MCP Server](https://github.com/couchbase/mcp-server-couchbase) ![official](https://img.shields.io/badge/official-2f6f4f) | Queries Couchbase and Capella clusters and inspects buckets from an agent. | `Python` | `couchbase` `database` `nosql` |
| [Elasticsearch MCP Server](https://github.com/elastic/mcp-server-elasticsearch) ![official](https://img.shields.io/badge/official-2f6f4f) | Natural-language search and index inspection over Elasticsearch clusters. | `Rust` | `search` `indexing` |
| [Redis MCP](https://github.com/redis/mcp-redis) ![official](https://img.shields.io/badge/official-2f6f4f) | Queries and manages Redis data structures with dedicated tools per type. | `Python` | `redis` `cache` `database` |
| [MotherDuck MCP Server](https://github.com/motherduckdb/mcp-server-motherduck) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs SQL against MotherDuck and local DuckDB files from an agent. | `Python` | `duckdb` `sql` `analytics` |
| [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) ![official](https://img.shields.io/badge/official-2f6f4f) | Google's server for querying SQL databases with pooling, IAM-aware auth and prebuilt tools. | `Go` | `database` `sql` `google-cloud` |
| [MongoDB MCP Server](https://github.com/mongodb-js/mongodb-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Queries and manages MongoDB collections and databases in read-only or full-access mode. | `TypeScript` | `mongodb` `database` |
| [Neo4j MCP](https://github.com/neo4j-contrib/mcp-neo4j) ![official](https://img.shields.io/badge/official-2f6f4f) | Cypher queries, schema inspection and graph data modelling for Neo4j. | `Python` | `graph-database` `cypher` |
| [Neon MCP Server](https://github.com/neondatabase/mcp-server-neon) ![official](https://img.shields.io/badge/official-2f6f4f) | Creates Neon projects and branches and runs SQL through the Neon management API. | `TypeScript` | `postgres` `serverless` `database` |
| [OpenSearch MCP Server](https://github.com/opensearch-project/opensearch-mcp-server-py) ![official](https://img.shields.io/badge/official-2f6f4f) | Searches OpenSearch clusters and runs queries through the OpenSearch Python client. | `Python` | `search` `indexing` `opensearch` |
| [Oracle MCP Servers](https://github.com/oracle/mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Oracle's suite of servers for SQLcl, database administration and Oracle Cloud resources. | `Python` | `oracle` `sql` `database` |
| [Pinecone MCP](https://github.com/pinecone-io/pinecone-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Connects Pinecone projects so assistants can search indexes and upsert vectors. | `TypeScript` | `vector-database` `search` |
| [Postgres MCP Pro](https://github.com/crystaldba/postgres-mcp) | Index tuning, health checks and safe SQL execution against PostgreSQL. | `Python` | `postgres` `sql` `performance` |
| [Qdrant MCP Server](https://github.com/qdrant/mcp-server-qdrant) ![official](https://img.shields.io/badge/official-2f6f4f) | Stores and retrieves semantic memories in a Qdrant collection. | `Python` | `vector-database` `embeddings` |
| [SingleStore MCP Server](https://github.com/singlestore-labs/mcp-server-singlestore) ![official](https://img.shields.io/badge/official-2f6f4f) | Manages SingleStore workspaces, databases and queries through the management API. | `Python` | `sql` `database` `analytics` |
| [Snowflake MCP](https://github.com/Snowflake-Labs/mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Snowflake's server for Cortex AI, SQL orchestration and semantic views over warehouse data. | `Python` | `snowflake` `sql` `analytics` |
| [Supabase MCP](https://github.com/supabase/mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Manages Supabase projects, runs SQL and inspects logs from an agent. | `TypeScript` | `postgres` `supabase` `database` |
| [Weaviate MCP Server](https://github.com/weaviate/mcp-server-weaviate) ![official](https://img.shields.io/badge/official-2f6f4f) | Searches and manages Weaviate collections so agents can store and retrieve vectorised content. | — | `vector-database` `embeddings` |

## Cloud & infrastructure

Cloud providers, containers, infrastructure as code and observability stacks.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [AWS MCP Servers](https://github.com/awslabs/mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | AWS-maintained suite covering documentation lookup, cost analysis, CDK and direct service APIs. | `Python` | `aws` `cloud` `cost` `iac` |
| [Cloudflare MCP Servers](https://github.com/cloudflare/mcp-server-cloudflare) ![official](https://img.shields.io/badge/official-2f6f4f) | Servers for Workers, D1, R2, KV and Cloudflare observability data. | `TypeScript` | `cloudflare` `workers` `storage` |
| [Kubernetes MCP Server (CNCF)](https://github.com/containers/kubernetes-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | CNCF-hosted server for Kubernetes and OpenShift that works against any cluster context. | `Go` | `kubernetes` `openshift` `devops` |
| [gcloud MCP](https://github.com/googleapis/gcloud-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs gcloud CLI commands for Google Cloud from an agent session. | `TypeScript` | `google-cloud` `gcloud` `cli` |
| [Grafana MCP](https://github.com/grafana/mcp-grafana) ![official](https://img.shields.io/badge/official-2f6f4f) | Searches dashboards and queries Prometheus, Loki and alerting data from Grafana. | `Go` | `observability` `metrics` `monitoring` |
| [Kubernetes MCP Server](https://github.com/Flux159/mcp-server-kubernetes) | Lists, reads and manages Kubernetes resources with kubectl-style operations. | `TypeScript` | `kubernetes` `devops` |
| [Microsoft MCP Catalog](https://github.com/microsoft/mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Microsoft's catalogue of official servers for Azure, Fabric, Dataverse and developer services. | `C#` | `microsoft` `azure` `cloud` |
| [Sentry Toolkit](https://github.com/getsentry/toolkit) ![official](https://img.shields.io/badge/official-2f6f4f) | Sentry's AI toolkit: error and trace access plus an MCP server for issue triage. | `TypeScript` | `monitoring` `errors` |
| [Terraform MCP Server](https://github.com/hashicorp/terraform-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Looks up provider documentation and registry modules so agents write correct Terraform. | `Go` | `terraform` `iac` |
| [Vault MCP Server](https://github.com/hashicorp/vault-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Reads and writes HashiCorp Vault secrets and inspects mounts from an agent. | `Go` | `vault` `secrets` `security` |

## Web, search & browsers

Search APIs, crawlers and real browser control, for agents that need to read or operate the web.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Apify MCP Server](https://github.com/apify/apify-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs Apify actors — scrapers, crawlers and AI jobs — from any MCP client and returns their datasets. | `TypeScript` | `scraping` `actors` `automation` |
| [Brave Search MCP](https://github.com/brave/brave-search-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Web, news and local search through the Brave Search API. | `TypeScript` | `search` `web` |
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Drives a real Chrome instance for performance traces, network inspection and debugging. | `TypeScript` | `browser` `debugging` `performance` |
| [Exa MCP Server](https://github.com/exa-labs/exa-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Neural web search, company research and page crawling through Exa's API. | `TypeScript` | `search` `research` |
| [Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Turns sites into clean Markdown and crawls them for agent consumption. | `JavaScript` | `scraping` `crawling` |
| [Jina AI MCP](https://github.com/jina-ai/MCP) ![official](https://img.shields.io/badge/official-2f6f4f) | Jina's remote server for web search, page reading and embeddings. | `TypeScript` | `search` `embeddings` `reader` |
| [Playwright MCP (community)](https://github.com/executeautomation/mcp-playwright) | Community Playwright server that adds API testing on top of browser automation. | `TypeScript` | `browser` `testing` `automation` |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Drives a browser through accessibility snapshots instead of screenshots, which keeps tokens down. | `TypeScript` | `browser` `automation` `testing` |
| [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Search, extract and crawl endpoints tuned for agent research workflows. | `TypeScript` | `search` `research` |

## Productivity & business

Notes, chat, tickets, mail, calendars and payments — the systems where work actually lives.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Bitwarden MCP Server](https://github.com/bitwarden/mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Lets an agent look up Bitwarden vault items and secrets. | `TypeScript` | `secrets` `security` `passwords` |
| [Google Workspace MCP](https://github.com/taylorwilsdon/google_workspace_mcp) | One server for Gmail, Drive, Calendar, Docs, Sheets, Slides and Tasks. | `Python` | `google` `email` `calendar` `documents` |
| [Linear MCP Server](https://github.com/jerhadf/linear-mcp-server) | Creates and searches Linear issues and projects from an agent session. | `JavaScript` | `issues` `project-management` |
| [mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | Searches and edits Jira issues and Confluence pages from one server. | `Python` | `jira` `confluence` `issues` |
| [Obsidian MCP](https://github.com/MarkusPfundstein/mcp-obsidian) | Reads and writes an Obsidian vault through its Local REST API plugin. | `Python` | `notes` `markdown` |
| [Notion MCP Server](https://github.com/makenotion/notion-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Notion's official server for pages, databases and blocks through the Notion API. | `TypeScript` | `notes` `documents` |
| [Slack MCP Server](https://github.com/korotovsky/slack-mcp-server) | Reads channels and threads and posts messages as a Slack user or bot. | `Go` | `slack` `chat` |
| [Spotify MCP](https://github.com/varunneal/spotify-mcp) | Controls playback, playlists and search in Spotify. | `Python` | `music` `media` |
| [Stripe AI Toolkit](https://github.com/stripe/ai) ![official](https://img.shields.io/badge/official-2f6f4f) | Stripe's toolkit, including an MCP server for customers, payments and documentation search. | `TypeScript` | `payments` `commerce` |
| [Todoist MCP](https://github.com/Doist/todoist-mcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Doist's tools for letting agents read and change Todoist tasks and projects. | `TypeScript` | `tasks` `todoist` |

## AI, models & retrieval

Model hubs, documentation retrieval and notebook access for agents that need external knowledge.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Context7](https://github.com/upstash/context7) ![official](https://img.shields.io/badge/official-2f6f4f) | Serves version-specific library documentation so generated code matches the installed release. | `TypeScript` | `documentation` `retrieval` |
| [Gemini Notebook MCP](https://github.com/jacob-bd/gemini-notebook-mcp-cli) | Reads and writes Gemini Notebook sources and notes from the CLI, MCP or agent skills. | `Python` | `gemini` `notebooks` `cli` |
| [Graphiti](https://github.com/getzep/graphiti) ![official](https://img.shields.io/badge/official-2f6f4f) | Builds a temporal knowledge graph for agent memory and ships an MCP server with it. | `Python` | `memory` `knowledge-graph` `retrieval` |
| [Hugging Face MCP Server](https://github.com/huggingface/hf-mcp-server) ![official](https://img.shields.io/badge/official-2f6f4f) | Searches models, datasets and Spaces on the Hugging Face Hub. | `TypeScript` | `models` `datasets` |
| [Mem0](https://github.com/mem0ai/mem0) ![official](https://img.shields.io/badge/official-2f6f4f) | Memory layer for agents that ships its own MCP server for storing and recalling context. | `Python` | `memory` `retrieval` |

## Clients & hosts

Applications that load MCP servers and hand their tools to a model, from desktop apps to IDE agents.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [5ire](https://github.com/nanbingxyz/5ire) ![official](https://img.shields.io/badge/official-2f6f4f) | Cross-platform desktop assistant with a local knowledge base and MCP server support. | `TypeScript` | `desktop` `agent` `knowledge-base` |
| [Cherry Studio](https://github.com/CherryHQ/cherry-studio) ![official](https://img.shields.io/badge/official-2f6f4f) | Desktop AI client with an MCP marketplace and per-assistant server selection. | `TypeScript` | `desktop` `chat` `marketplace` |
| [Cline](https://github.com/cline/cline) ![official](https://img.shields.io/badge/official-2f6f4f) | VS Code agent that loads MCP servers and exposes their tools inside the editor. | `TypeScript` | `vscode` `coding-agent` |
| [OpenAI Codex CLI](https://github.com/openai/codex) ![official](https://img.shields.io/badge/official-2f6f4f) | OpenAI's terminal coding agent, with MCP servers configurable as tool providers. | `Rust` | `cli` `coding-agent` |
| [Continue](https://github.com/continuedev/continue) ![official](https://img.shields.io/badge/official-2f6f4f) | Open-source IDE extension and CLI that can attach MCP servers as tools. | `TypeScript` | `ide` `coding-agent` |
| [Crush](https://github.com/charmbracelet/crush) ![official](https://img.shields.io/badge/official-2f6f4f) | Charm's terminal coding agent, with MCP servers configured per project. | `Go` | `cli` `coding-agent` `tui` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) ![official](https://img.shields.io/badge/official-2f6f4f) | Google's terminal agent, which loads MCP servers from its settings file. | `TypeScript` | `cli` `coding-agent` `gemini` |
| [Goose](https://github.com/aaif-goose/goose) ![official](https://img.shields.io/badge/official-2f6f4f) | Local agent that connects MCP servers alongside its own extension system. | `Rust` | `agent` `desktop` |
| [LibreChat](https://github.com/LibreChat-AI/LibreChat) ![official](https://img.shields.io/badge/official-2f6f4f) | Self-hosted chat platform whose agents can attach MCP servers as tools. | `TypeScript` | `self-hosted` `chat` `agents` |
| [LobeHub](https://github.com/lobehub/lobehub) ![official](https://img.shields.io/badge/official-2f6f4f) | Agent workspace and chat platform that installs MCP plugins from a built-in marketplace. | `TypeScript` | `agents` `chat` `marketplace` |
| [Open WebUI](https://github.com/open-webui/open-webui) ![official](https://img.shields.io/badge/official-2f6f4f) | Self-hosted chat interface that reaches MCP servers through its mcpo bridge. | `Svelte` | `self-hosted` `chat` `web-ui` |
| [Qwen Code](https://github.com/QwenLM/qwen-code) ![official](https://img.shields.io/badge/official-2f6f4f) | Qwen's terminal coding agent, forked from Gemini CLI with MCP support intact. | `TypeScript` | `cli` `coding-agent` `qwen` |
| [Visual Studio Code](https://github.com/microsoft/vscode) ![official](https://img.shields.io/badge/official-2f6f4f) | Editor with built-in MCP support, so agent mode can call local and remote servers. | `TypeScript` | `editor` `ide` `agent-mode` |
| [Zed](https://github.com/zed-industries/zed) ![official](https://img.shields.io/badge/official-2f6f4f) | Rust editor whose agent panel loads MCP servers as context servers. | `Rust` | `editor` `agent` `rust` |

## Tools & utilities

Inspectors, proxies, gateways and context helpers that sit around servers rather than replacing them.

| Project | What it does | Language | Tags |
| --- | --- | --- | --- |
| [Context Mode](https://github.com/mksglu/context-mode) ![official](https://img.shields.io/badge/official-2f6f4f) | Keeps large tool output out of the context window by sandboxing it behind SQLite full-text search. | `JavaScript` | `context` `search` `tooling` |
| [Docker MCP Gateway](https://github.com/docker/mcp-gateway) ![official](https://img.shields.io/badge/official-2f6f4f) | Runs containerised MCP servers behind one gateway with shared configuration and secrets. | `Go` | `docker` `gateway` |
| [MarkItDown MCP](https://github.com/microsoft/markitdown) ![official](https://img.shields.io/badge/official-2f6f4f) | Converts PDFs, Office files and images to Markdown before they reach the model. | `Python` | `markdown` `conversion` `documents` |
| [MCP Context Forge](https://github.com/IBM/mcp-context-forge) ![official](https://img.shields.io/badge/official-2f6f4f) | IBM's gateway, registry and proxy that fronts MCP, A2A and REST APIs with guardrails. | `Python` | `gateway` `registry` `proxy` `guardrails` |
| [MCP Inspector](https://github.com/modelcontextprotocol/inspector) ![official](https://img.shields.io/badge/official-2f6f4f) | Interactive UI and CLI for exercising a server's tools, prompts and resources while developing. | `TypeScript` | `debugging` `testing` |
| [mcp-proxy](https://github.com/sparfenyuk/mcp-proxy) | Bridges stdio and SSE transports so clients and servers with different transports can talk. | `Python` | `proxy` `transport` |
| [MCPB Desktop Extensions](https://github.com/modelcontextprotocol/mcpb) ![official](https://img.shields.io/badge/official-2f6f4f) | Packages a local MCP server as a one-click desktop extension (formerly DXT). | `TypeScript` | `packaging` `desktop` `distribution` |
| [mcpo](https://github.com/open-webui/mcpo) ![official](https://img.shields.io/badge/official-2f6f4f) | Wraps any stdio MCP server behind an OpenAPI endpoint for clients that cannot speak MCP. | `Python` | `proxy` `openapi` |
| [MetaMCP](https://github.com/metatool-ai/metamcp) ![official](https://img.shields.io/badge/official-2f6f4f) | Aggregates many MCP servers behind one endpoint with namespaces and a web UI. | `TypeScript` | `gateway` `aggregator` `docker` |
| [Smithery CLI](https://github.com/arcadeai-labs/smithery-cli) ![official](https://img.shields.io/badge/official-2f6f4f) | Installs and manages MCP servers published to the Smithery registry. | `TypeScript` | `registry` `cli` |

## Legend

- **official** — published by the vendor or project team that owns the product or protocol, as opposed to a third-party wrapper around its API.
- **kind** — `server` exposes tools over MCP, `client` consumes them, `framework` is used to build either, `tool` is a helper around MCP, `registry` is a catalog or discovery service.
- **language** — the main implementation language of the repository, used to filter what you can debug locally.

## Contributing

Add or fix one object in [`data/servers.json`](data/servers.json), run `npm run check`, and open a pull request. [`CONTRIBUTING.md`](CONTRIBUTING.md) has the field rules and the review criteria (active project, working install, no dead links).

_Generated from `data/servers.json` (last reviewed 2026-11-06). Do not edit the tables by hand._
