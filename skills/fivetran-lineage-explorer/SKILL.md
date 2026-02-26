---
name: fivetran-lineage-explorer
description: "Map the flow of data from sources to destinations. Answers questions like 'Where does this table come from?' or 'Which connectors write to this warehouse?'. Use for understanding the data landscape."
---

# Fivetran Lineage Explorer

## Overview
Helps users navigate their modern data stack by tracing dependencies between Fivetran connectors and destination schemas.

## Workflow

### Step 1: Map Global Topology
Call the tool `get_lineage_report` to get a complete mapping of every connector to its destination. This provides the most efficient starting point for understanding the account topology.

### Step 2: Search by Table or Keyword
If the user asks about a specific table, call `find_connector_by_table(table_name="...")`.
If they ask about a service (e.g., "HubSpot"), search the results from Step 1 or call `list_connectors`.

### Step 3: Trace Source to Sink
Match the `group_id` of connectors to the `id` of destinations (this is done automatically by `get_lineage_report`).
- Extract `schema` from the connector (source schema).
- Extract `schema` from the destination (target warehouse schema).

### Step 4: Map Tables
Call `get_connector_schema` to identify the specific tables and schemas being synced for a selected connector.

### Step 5: Visualize Lineage
Output a Markdown table or Mermaid diagram showing the flow:
`[Source] --(Connector)--> [Fivetran] --(Schema)--> [Warehouse]`
