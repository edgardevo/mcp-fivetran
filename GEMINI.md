# Fivetran Gemini CLI Extension

This extension provides a specialized interface for auditing and inspecting Fivetran accounts. It is strictly **read-only** and designed with security and compliance in mind.

## 🚨 Tool Affinity Mandate (CRITICAL)

To ensure consistency, security, and proper redaction, you **MUST** follow these rules for all Fivetran interactions:

1. **Use MCP Tools Only**: ALWAYS use the provided MCP tools (e.g., `list_all_connections`, `get_connector_details`) to interact with the Fivetran API.
2. **NO CURL / NO SCRIPTS**: Never generate or execute `curl` commands, `https` scripts, or manual API calls.
3. **Redaction Trust**: Trust the data returned by the tools. All sensitive fields are automatically redacted by the server.
4. **Tool Discovery**: If you are unsure which tool to use, list the available tools first. Do not assume the API endpoint path is the tool name (though they are often similar).

## Setup

### Authentication
This extension requires a Fivetran API Key and Secret. To avoid being prompted during installation, ensure these are set in your shell environment or a `.env` file in the extension directory:

- `FIVETRAN_API_KEY`: Your Fivetran API Key.
- `FIVETRAN_API_SECRET`: Your Fivetran API Secret.

You can find these in your Fivetran account settings under **API Config**.

## Core Mandates

- **Mostly Read-Only**: This extension primarily supports `GET` operations for auditing. It also provides specific tools (`create_connector`, `sync_connector`, `resync_connector`) for managing connections. Do not attempt to create, update, or delete other resources manually.
- **Security-First**: All outputs are automatically redacted for sensitive information (passwords, secrets, tokens). You can trust the data returned is safe for analysis.
- **Data-Driven**: Use the inspection tools to gather facts about connectors, users, and groups before making conclusions.

## Key Features

### 1. Recursive Redaction
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
