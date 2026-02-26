---
name: fivetran-sync-triage
description: "Diagnose and provide remediation steps for failing syncs. Analyzes error logs, cross-references with known Fivetran issues, and suggests specific fixes. Use when a connector is 'Broken' or reporting errors."
---

# Fivetran Sync Triage

## Overview
Automates the investigation of connector failures. This skill acts as a support engineer, digging into the `last_sync_error` and `setup_tests` to find the root cause.

## Workflow

### Step 1: Fetch Faulty Connector
When a user reports a failure, fetch the specific connector metadata.
```
get_connector_details(connector_id="[ID]")
```

### Step 2: Analyze Logs
Inspect the `status` object for:
- `sync_state`: Verify if it's "broken".
- `setup_state`: Check if setup tests are passing.
- `last_sync_error`: Parse the error message for keywords like "Authentication", "Permissions", or "Network".

### Step 3: Match Known Issues
Compare findings against `rules/fivetran-audit.md` or common API errors.
- **Auth Errors:** Recommend re-authenticating the source.
- **Permission Errors:** Provide the specific SQL `GRANT` or IAM role required.
- **Schema Errors:** Suggest checking for unsupported data types.

### Step 4: Present Remediation
Provide a clear, bulleted list of "Next Steps" for the user to follow in the Fivetran UI or their source system.
