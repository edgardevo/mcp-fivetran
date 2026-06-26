# dgc-fivetran

A specialized MCP server (and Gemini CLI extension) for auditing, inspecting, and managing Fivetran accounts and Fivetran Activations (Census) reverse-ELT pipelines.

Repository: [github.com/edgardevo/mcp-fivetran](https://github.com/edgardevo/mcp-fivetran) · Issues: [issues](https://github.com/edgardevo/mcp-fivetran/issues) · License: [MIT](LICENSE)

## Key Features

- **Audit-Focused**: The majority of tools are read-only `GET` operations for auditing and inspection — every read endpoint in the Fivetran REST API is covered. Destructive and account-mutating operations are gated (see below) or intentionally omitted.
- **Write Operations**: A set of gated write tools is available for operational tasks — create/update/delete connectors, destinations and groups, manage group membership, generate Connect Card setup links, trigger syncs/resyncs, run setup tests, edit schema/table/column configs, and reload/drop/resync schema items. Destructive deletes require an explicit `confirm=true`. All other Fivetran tools are read-only.
- **Support for Fivetran Activations (Census)**: Full set of tools to audit reverse-ELT syncs, sources, and destinations.
- **Security-First**:
  - **Recursive Redaction**: All outputs are scrubbed for sensitive keys (passwords, secrets, tokens, API keys). Redaction uses exact key names and suffix matching to avoid clobbering legitimate fields like `api_key_id` or `auth_type`. A bare `key` field is redacted only when nested inside a credential-bearing container (`config`, `auth`, `secrets`, `credentials`), so legitimate top-level `key` fields are preserved.
  - **Rate-Limit Safety**: 429 responses are retried with `Retry-After` honored, capped at 3 retries to prevent unbounded recursion.
- **MCP Prompts**: Reusable workflow prompts (`fivetran_health_report`, `fivetran_security_audit`, `fivetran_sync_triage`, `fivetran_lineage_overview`) are exposed via the MCP prompts capability, so any MCP client — not just Gemini CLI — can run the audit playbooks.
- **Data Export**: Built-in tools to export data to CSV/JSON for offline analysis.
- **Pagination**: The aggregate/audit tools and the export tools follow cursor-based pagination automatically (via a shared `fetchAllPages` helper), so they don't undercount large accounts. The individual generated GET tools return a single page — use `get_next_page` or the export tools to fetch more.

## Setup

### Prerequisites
- Node.js 20+
- npm

### Installation

The package exposes a `dgc-fivetran` binary, so MCP clients can launch it directly without a manual build. Run it straight from the GitHub repo with `npx` (the `prepare` script builds on install):

```bash
npx github:edgardevo/mcp-fivetran
```

Or clone for local development:

```bash
git clone https://github.com/edgardevo/mcp-fivetran.git
cd mcp-fivetran
npm install   # runs the build via the prepare hook
```

Example MCP client config (e.g. Claude Desktop / Claude Code), passing credentials through `env`:

```json
{
  "mcpServers": {
    "fivetran": {
      "command": "npx",
      "args": ["-y", "github:edgardevo/mcp-fivetran"],
      "env": {
        "FIVETRAN_API_KEY": "your_key",
        "FIVETRAN_API_SECRET": "your_secret",
        "CENSUS_API_KEY": "your_census_key"
      }
    }
  }
}
```

### Configuration

Set your API credentials in a `.env` file (gitignored):

```env
# Standard Fivetran ELT
FIVETRAN_API_KEY=your_key
FIVETRAN_API_SECRET=your_secret

# Fivetran Activations (Census)
CENSUS_API_KEY=your_census_key

# Opt in to gated write tools (connector create/update, sync/resync, setup tests, schema/table/column config edits).
# Defaults to read-only mode when unset. Truthy values: true, 1, yes (case-insensitive).
FIVETRAN_ALLOW_WRITES=
```

You only need the keys for the surfaces you intend to use — missing keys disable the corresponding tool group at startup with a warning.

#### Read-only mode (default)

The server runs in read-only mode unless `FIVETRAN_ALLOW_WRITES` is set to a truthy value (`true`, `1`, or `yes`, case-insensitive). When read-only, all write tools — connector create/update/delete, sync/resync, setup tests, destination CRUD, and schema/table/column config edits — are not registered and therefore cannot be invoked by the model. (See [DOCS.md](DOCS.md) for the full list; write tools are marked with their HTTP verb.) All other tools — including everything in `generated_tools.ts` and the Census activations tools — remain available.

#### Required API permissions

| API | Where to create the token | Permissions / role |
| --- | --- | --- |
| Fivetran | Dashboard → **Settings → API Config** → *Generate API key* | Account-scoped key. *Account Admin* role for full audit + write tools; a read-only role works for the audit subset. See [Fivetran REST API auth](https://fivetran.com/docs/rest-api/getting-started). |
| Census (Activations) | Workspace → **Settings → API Tokens** *(Workspace API Token)* or your user profile *(Personal Access Token)* | Workspace token for syncs/sources/destinations; PAT to also list workspaces and users. See [Census API auth](https://docs.getcensus.com/basics/api). |

> Treat these credentials like production secrets. They are sent over TLS to the upstream API only — never to an LLM — and any responses are passed through the redaction layer before being returned to the model.

## Usage

### Gemini CLI

```bash
gemini extensions link .
```

The `gemini-extension.json` manifest ships the MCP server plus the bundled skills, rules, references, and slash commands listed under [Bundled extension assets](#bundled-extension-assets).

### Claude Desktop

Add to `claude_desktop_config.json` (macOS path: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fivetran": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-fivetran/dist/index.js"],
      "env": {
        "FIVETRAN_API_KEY": "...",
        "FIVETRAN_API_SECRET": "...",
        "CENSUS_API_KEY": "..."
      }
    }
  }
}
```

Restart Claude Desktop after editing.

### Claude Code

```bash
claude mcp add fivetran -- node /absolute/path/to/mcp-fivetran/dist/index.js
```

Then set the env vars in your shell or in `~/.claude/settings.json` under `env`.

### Cursor / Continue / other MCP clients

Any MCP-compatible client can launch the server over stdio. Configure the client to run:

```
command: node
args:    ["/absolute/path/to/mcp-fivetran/dist/index.js"]
env:     FIVETRAN_API_KEY, FIVETRAN_API_SECRET, CENSUS_API_KEY
```

Bundled skills, rules, and slash commands are Gemini-CLI–specific and are ignored by other clients — the MCP tools themselves are available everywhere.

### Example prompts

Once installed, try asking the model:

- *"Show me a health summary of my Fivetran account."*
- *"Which connectors are broken right now and what's the most recent error?"*
- *"Map every connector to its destination and show me the lineage."*
- *"Find the connector responsible for syncing the `orders` table."*
- *"Export an audit report covering users, teams, roles, and connectors."*
- *"List all Census syncs and show recent sync runs for sync `12345`."*
- *"Force a sync on connector `abc_def` and report when it finishes."*

## Tool catalogue

See [DOCS.md](DOCS.md) for the auto-generated reference of every tool, its description, and its parameters (regenerate with `npm run docs`).

Tools are registered in three groups (see `src/`):

### Custom audit & operations (`src/custom_tools.ts`)
**Read/audit:** `test_connection`, `get_account_health_summary`, `get_lineage_report`, `analyze_connector_issues`, `find_connector_by_table`, `export_audit_report`, `export_fivetran_data`, `get_next_page`, `list_connectors`, `get_connector_details`, `get_connector_schema`, `get_connector_columns`.

**Write (gated behind `FIVETRAN_ALLOW_WRITES`):** `create_connector`, `update_connector`, `delete_connector`, `sync_connector`, `resync_connector`, `run_connection_tests`, `create_destination`, `update_destination`, `delete_destination`, `run_destination_tests`, `create_group`, `update_group`, `delete_group`, `add_user_to_group`, `remove_user_from_group`, `create_connect_card`, `update_schema_config`, `update_database_schema_config`, `update_table_config`, `update_column_config`, `reload_connector_schema`, `drop_blocked_columns`, `resync_connector_tables`, `drop_blocked_column`.

See [DOCS.md](DOCS.md) for the always-current, auto-generated reference.

### Fivetran REST API (`src/generated_tools.ts`)
~63 read-only tools generated from `openapi.json`, grouped roughly as:
- **Account & Auth**: `get_account_info`, `get_account_log_service_details`, `list_log_services`, `get_log_service_details`, `get_system_keys`, `get_system_key_details`.
- **Users & Teams**: `list_all_users`, `user_details`, `list_all_teams`, `team_details`, `list_users_in_team`, `get_user_in_team`, membership getters.
- **Groups**: `list_all_groups`, `group_details`, `group_service_account`, `group_ssh_public_key`, `list_all_users_in_group`.
- **Connectors**: `list_all_connections`, `list_all_connections_in_group`, `connection_details`, `connection_schema_config`, `connection_column_config`, `connection_state`, `metadata_connectors`, `metadata_public_connectors`, `metadata_connector_config`.
- **Destinations**: `list_destinations`, `destination_details`.
- **Roles**: `list_all_roles`.
- **Certificates & Fingerprints**: `get_connection_certificates_list`, `get_connection_certificate_details`, `get_connection_fingerprints_list`, `get_connection_fingerprint_details`, plus destination equivalents.
- **Networking**: `get_proxy_agent`, `get_proxy_agent_details`, `get_proxy_agent_connections`, `get_private_links`, `get_private_link_details`, `get_hybrid_deployment_agent_list`, `get_hybrid_deployment_agent`.
- **Webhooks**: `list_all_webhooks`, `webhook_details`.
- **Transformations**: `transformations_list`, `transformation_details`, `list_all_transformation_projects`, `transformation_project_details`, `transformation_package_metadata_list`, `transformation_package_metadata_details`.
- **Connector SDK**: `list_connector_sdk_packages`, `get_connector_sdk_package`, `download_connector_sdk_package`.

### Census Activations (`src/census_tools.ts`)
`activations_list_workspaces`, `activations_get_workspace`, `activations_list_users`, `activations_list_syncs`, `activations_get_sync`, `activations_list_sync_runs`, `activations_get_sync_run`, `activations_list_sources`, `activations_list_destinations`.

The generated Fivetran API tools in `src/generated_tools.ts` are derived from `openapi.json`. The original code generator is not bundled in this repo; update `generated_tools.ts` to match `openapi.json` when the spec changes (keep the `toToolResult(response)` return pattern used by the existing tools).

## Bundled extension assets

These ship with the extension and load automatically in Gemini CLI. Other MCP clients ignore them — the underlying tools remain callable directly.

| Path | What it is |
| --- | --- |
| `skills/` | Prompt-engineered playbooks (`fivetran-health-report`, `fivetran-security-audit`, `fivetran-activations-audit`, `fivetran-connector-onboarding`, `fivetran-lineage-explorer`, `fivetran-sync-triage`). Each is a folder with a `SKILL.md` providing the workflow the model should follow. |
| `rules/` | Behavioral rules that always apply when the extension is loaded (e.g. `fivetran-audit.md`). |
| `references/` | Reusable templates (e.g. `audit-templates.md`) the skills cite for consistent report formatting. |
| `commands/fivetran/` | Gemini CLI slash commands (`/audit`, `/health-report`, `/lineage`, `/onboarding`, `/sync-triage`, `/activations-audit`, `/status`, `/export_audit`, `/skill-creator`). |

## Testing

Unit tests run via [Vitest](https://vitest.dev/) and use mocked `fetch` — no live API credentials are required.

```bash
npm test          # one-shot
npm run test:watch
```

Tests live in `tests/` and cover the redaction logic, JSON flattening for CSV export, and the 429 retry cap.

## Development

```bash
npm run dev          # run from source via tsx (no build step)
npm run build        # tsc → dist/
npm run lint         # prek (pre-commit hooks)
npm run validate     # validate skills/rules frontmatter
npm run docs         # regenerate DOCS.md from the tool registry
npm run bump <type>  # bump version (patch|minor|major|x.y.z) in all 3 locations
```

### Adding a new tool

1. **Custom tool** (audit, lineage, multi-step logic): add a `server.tool(...)` call in `src/custom_tools.ts`.
2. **Census tool**: add it in `src/census_tools.ts`.
3. **Generated tool from a new Fivetran endpoint**: add it to `openapi.json` and mirror the change in `src/generated_tools.ts`, following the existing tool pattern (Zod params + `toToolResult(response)`).
4. Run `npm test && npm run build` before committing. `prek` hooks run on commit.

### Versioning

The version is hardcoded in three places that must stay in sync: `package.json`, `gemini-extension.json`, and `src/index.ts` (reported to MCP clients during the handshake). `npm run bump <patch|minor|major>` updates all three at once via `scripts/bump-version.mjs`.

To cut a release without touching files by hand, trigger the **Version Bump** GitHub Action (`Actions → Version Bump → Run workflow`, pick patch/minor/major). It runs the bump script, commits, creates a `vX.Y.Z` tag, and pushes.

### CI

GitHub Actions (`.github/workflows/`):

- **CI** (`ci.yml`) — on every push/PR to `main`: builds (`tsc`), runs the Vitest suite, and runs all `prek` hooks (via `uvx prek`).
- **Version Bump** (`version-bump.yml`) — manual `workflow_dispatch` trigger described above.

### Project layout

```
.
├── src/
│   ├── index.ts            # MCP server entrypoint (stdio transport, health checks)
│   ├── common.ts           # Fivetran + Census HTTP clients, redaction, retry cap
│   ├── custom_tools.ts     # Audit, lineage, export, write ops
│   ├── generated_tools.ts  # Auto-generated read-only Fivetran tools
│   └── census_tools.ts     # Census (Activations) tools
├── tests/                  # Vitest unit tests (mocked fetch)
├── skills/                 # Gemini CLI skill packs (SKILL.md per folder)
├── rules/                  # Gemini CLI behavioral rules
├── references/             # Report/audit templates referenced by skills
├── commands/fivetran/      # Gemini CLI slash command definitions (.toml)
├── scripts/
│   ├── generate-docs.mts         # Tool registry → DOCS.md
│   ├── bump-version.mjs          # Version bump across the 3 locations
│   └── validate-template.mjs     # Skills/rules frontmatter validation
├── openapi.json            # Fivetran REST API spec (source for generated tools)
├── openapi_census.json     # Census API spec
├── gemini-extension.json   # Gemini CLI extension manifest
└── prek.toml               # Pre-commit hook config
```

## License

[MIT](LICENSE) © Edgar Ochoa
