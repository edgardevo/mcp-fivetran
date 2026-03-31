# Fivetran Activations (Census) Audit

This skill guides the agent through auditing and mapping "Reverse ELT" pipelines managed by Fivetran Activations (Census).

## Goal
To provide a comprehensive health and lineage report of how data is synced from a source warehouse back into business applications (destinations).

## Workflow

### 1. Identify active Workspaces
Use `activations_list_workspaces` to identify all available environments. Note that Organization-level APIs (Users, Workspaces) use a Personal Access Token, while Workspace-level APIs use a Workspace API Key.

### 2. Map Sources to Destinations
For each relevant workspace:
- List available sources: `activations_list_sources`.
- List configured destinations: `activations_list_destinations`.
- List active syncs: `activations_list_syncs`.

### 3. Analyze Pipeline Health
- For each sync, check its recent history using `activations_list_sync_runs`.
- Identify syncs with high failure rates or persistent errors.

### 4. Construct Lineage
Map the flow:
`Source (Warehouse)` → `Census Sync (Mapping/Logic)` → `Destination (SaaS/Application)`

## Key Considerations
- **Redaction**: Just like standard Fivetran tools, all sensitive keys in Activations are automatically redacted.
- **Regions**: Activations API supports both US and EU regions.
- **Reverse ELT vs ELT**: Remember that Activations *pushes* data to SaaS tools, whereas standard Fivetran *pulls* data from them.
