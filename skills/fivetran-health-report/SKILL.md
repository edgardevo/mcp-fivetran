---
name: fivetran-health-report
description: "Generate a comprehensive health report of all data pipelines. Analyzes sync states, identifies high-latency connectors, and summarizes account usage. Use this when you need a snapshot of current data operations."
---

# Fivetran Health Report

## Overview
Provides a high-level summary of the Fivetran account's health. It methodically scans all connectors, calculates success rates, and flags operational bottlenecks.

## Workflow

### Step 1: Query Connectors
Call the tool `get_account_health_summary` to get a pre-processed overview of the account status. If you need the raw list for more granular analysis, call `list_all_connections`.

### Step 2: Categorize Status
Group connectors by `sync_state` (returned in the health summary or connection list):
- **🟢 Scheduled/Syncing:** Active pipelines.
- **🟡 Paused:** Manual intervention or idle.
- **🔴 Broken/Delayed:** Immediate action required.

### Step 3: Analyze Latency
Identify connectors where `failed_at` is more recent than `succeeded_at` or where the last successful sync was more than 24 hours ago. Use `analyze_connector_issues` for a deep-dive into persistent failures.

### Step 4: Generate Summary
Use the `Executive Audit Summary` template from `references/audit-templates.md` to format the final report.

### Step 5: Propose Actions
For every 🔴 connector, call the tool `get_connector_details` to inspect the `setup_tests` and `status` objects for specific error messages.
