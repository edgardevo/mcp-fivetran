# Fivetran Gemini CLI Extension

This extension provides a specialized interface for auditing and inspecting Fivetran accounts and Fivetran Activations (Census) reverse-ELT pipelines. It is strictly **read-only** for operational tools and designed with security and compliance in mind.

## 🚨 Tool Affinity Mandate (CRITICAL)

To ensure consistency, security, and proper redaction, you **MUST** follow these rules for all Fivetran and Activations interactions:

1. **Use MCP Tools Only**: ALWAYS use the provided MCP tools (e.g., `list_all_connections`, `activations_list_syncs`) to interact with the Fivetran and Census APIs.
2. **NO CURL / NO SCRIPTS**: Never generate or execute `curl` commands, `https` scripts, or manual API calls.
3. **Redaction Trust**: Trust the data returned by the tools. All sensitive fields (Fivetran & Census) are automatically redacted by the server.

## Setup

### Authentication
This extension requires Fivetran API credentials and/or a Census API Key. Ensure these are set in your shell environment or a `.env` file:

- `FIVETRAN_API_KEY`: Your Fivetran API Key.
- `FIVETRAN_API_SECRET`: Your Fivetran API Secret.
- `CENSUS_API_KEY`: Your Census Personal Access Token or Workspace API Key.

## Core Mandates

- **Read-Only Inspection**: This extension provides `GET` operations for auditing. Do not attempt to modify resources manually.
- **Security-First**: All outputs are automatically redacted for sensitive information. You can trust the data returned is safe for analysis.
- **Data-Driven**: Use the inspection tools to gather facts about connectors, syncs, users, and groups before making conclusions.

## Key Features

### 1. Unified Audit
Audit both standard ELT (Fivetran) and Reverse ELT (Activations/Census) pipelines from a single interface.

### 2. Recursive Redaction
All API responses are scrubbed for sensitive keys. If you see `[REDACTED]`, it means a password or token was removed for safety.

### 2. Pagination Support
Fivetran uses cursor-based pagination.
- Responses containing a `next_cursor` indicate more data is available.
- Use the `get_next_page` tool with the `endpoint` and `cursor` to fetch subsequent results.

### 3. Data Export
For large-scale auditing, use the `export_fivetran_data` tool. This will generate a CSV file in the `exports/` directory for offline analysis.

## Available Tools

### Core Discovery Tools
Most Fivetran `GET` endpoints are exposed as tools. Common ones include:

- `list_all_connections`: List all connectors in the account.
- `get_connector_details`: Detailed info for a specific connector.
- `list_all_users`: List all users.
- `list_all_groups`: List all groups/destinations.
- `get_account_info`: Get account details from the API key.

### Specialized Audit Tools

- `get_account_health_summary`: Global overview of connector statuses.
- `get_lineage_report`: Source-to-sink mapping.
- `analyze_connector_issues`: Deep-dive into failing connectors.
- `find_connector_by_table`: Find the connector for a specific table.
- `get_next_page`: Fetches the next page of a paginated resource.
- `export_fivetran_data`: Exports resource data to a CSV file.

## Operational Guidelines

### Analyzing Connectors
When auditing connectors, look at:
1. `service`: The type of source (e.g., `postgres`, `salesforce`).
2. `status`: Check `sync_state` and `setup_tests`.
3. `config`: Note the host and database, but expect credentials to be redacted.

### Handling Errors
- **401 Unauthorized**: The `FIVETRAN_API_KEY` or `FIVETRAN_API_SECRET` is incorrect.
- **403 Forbidden**: The API key lacks the necessary permissions to view the resource.
- **429 Too Many Requests**: The extension handles this automatically with a back-off and retry mechanism.
