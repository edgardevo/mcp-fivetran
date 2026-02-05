# Fivetran Gemini CLI Extension Documentation

## Security Measures

### Read-Only Access
This extension interacts with Fivetran via the `mcp-fivetran-read-only` scope. It can only inspect, audit, and analyze your account. No write or delete operations are permitted.

### Recursive Redaction
All API responses are automatically scanned for sensitive keys before being returned to the AI model. 
- **Trigger keywords**: `password`, `secret`, `key`, `token`, `cert`.
- **Replacement**: `[REDACTED]`

For example:
```json
{
  "service": "postgres",
  "config": {
    "host": "db.example.com",
    "password": "[REDACTED]"
  }
}
```

### Throttling
Requests are limited to **800 per minute** globally to prevent hitting API rate limits. If a 429 error occurs, the extension will automatically back off and retry based on the `Retry-After` header.

## Available Tools

### Core Discovery Tools
Almost every generic Fivetran GET endpoint is exposed as a tool. Tool names match the OpenAPI `operationId` (sanitized).

Example:
- `get_users(limit=10, cursor=None)`
- `get_connectors(limit=100)`
- `get_groups()`

### Specialized Tools

#### `get_next_page`
- **Purpose**: Navigate through paginated results.
- **Input**: `endpoint` (the resource path), `cursor` (from previous response).
- **Output**: The next batch of items and a new `next_cursor`.

#### `export_fivetran_data`
- **Purpose**: Export large datasets to CSV for offline analysis.
- **Input**: `endpoint` (e.g., `/connectors`), `limit` (max pages).
- **Output**: Path to the generated CSV file in the `exports/` directory.

## Troubleshooting

### Startup Failures
- `401 Unauthorized`: Check your API Key and Secret in `.env`.
- `403 Forbidden`: Ensure your API key has sufficient permissions.

### Rate Limits
If you see "Rate limited" logs, the extension is doing its job. It will pause and retry automatically.
