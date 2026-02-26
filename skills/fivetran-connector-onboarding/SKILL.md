---
name: fivetran-connector-onboarding
description: "Assist in setting up new Fivetran connectors. Analyzes source requirements and provides the exact configuration payload needed for the API. Use when adding a new source to the data stack."
---

# Fivetran Connector Onboarding

## Overview
Guides users through the complex configuration of new connectors, ensuring all required fields are provided before calling the creation API.

## Workflow

### Step 1: Identify Service
The user specifies the source (e.g., "Postgres").
```
metadata_connectors()
```
Identify the required configuration schema for that service.

### Step 2: Gather Params
Ask the user for the necessary details:
- `host`, `port`, `database`.
- `user`, `password` (remind them these will be redacted in the agent context).
- `sync_frequency`.

### Step 3: Validate Config
Ensure the payload matches Fivetran's expected structure. Check for `trust_certificates` or `networking_method` (SSH vs Direct).

### Step 4: Generate Creation Payload
Provide the user with a JSON snippet representing the `POST /connectors` body.

### Step 5: Execute (Optional)
If the user confirms, provide the exact tool call to create the connector.
