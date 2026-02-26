---
name: fivetran-security-audit
description: "Perform a comprehensive security and health audit of a Fivetran account. This skill guides the agent through: (1) Listing all connectors and destinations, (2) Identifying failed setup tests or sync errors, (3) Checking for unmasked sensitive configurations, and (4) Generating a standardized audit report or CSV export."
---

# Fivetran Security Audit

## Keywords
security audit, health check, fivetran audit, connector status, destination check, setup tests, failed syncs, audit report, export audit

## Overview

Automatically perform a security and configuration audit of a Fivetran account. This skill methodically inspects connectors and destinations to identify risks (like failed tests or sync errors) and synthesizes findings into a professional report.

**Use this skill when:** A user wants to "audit our Fivetran account", "check for issues", or "verify security settings".

---

## Workflow

Follow this 5-step process to conduct a thorough Fivetran audit:

### Step 1: Discover Resources

Fetch the complete list of connectors and destinations to establish the audit scope.

```
list_all_connections()
list_destinations(cloudId="...")
```

---

### Step 2: Identify Critical Failures

Scan the fetched resources for immediate operational or security issues.

**Look for:**
- **Connector Status:** `sync_state` not in "scheduled" or "syncing" (e.g., "paused", "broken").
- **Setup Tests:** Any connector where `setup_tests` contains failures.
- **Last Sync:** Connectors that haven't synced successfully in the last 24 hours.

---

### Step 3: Analyze Sensitive Configurations

Review the configuration of connectors and destinations for potential security risks.

**Look for:**
- **Redaction Check:** Verify that all sensitive keys in the `config` object are correctly marked as `[REDACTED]`. If any raw passwords or keys are visible, flag this as a **CRITICAL** vulnerability.
- **Service Risks:** Identify connectors using deprecated or high-risk services (e.g., legacy database versions).

---

### Step 4: Generate Report

Synthesize the findings into a standardized format. Use the templates in `references/audit-templates.md`.

**The report should include:**
1. **Summary:** Overall account health (🟢 Healthy / 🟡 Warning / 🔴 Critical).
2. **Connector Breakdown:** Detailed table of broken or high-risk connectors.
3. **Destination Health:** Verification of storage health.
4. **Security Findings:** Any unmasked secrets or access control concerns.

---

### Step 5: Export Data (Optional)

Offer the user a detailed CSV export for deep-dive analysis.

**Ask:** "Would you like me to export the full raw audit data to a CSV for your records?"

If yes:
```
export_fivetran_data(
  endpoint="connectors",
  cloudId="..."
)
```

---

## Tips for High-Quality Audits

- **Be Data-Driven:** Reference specific connector IDs and service types.
- **Categorize by Severity:** Distinguish between a "Paused" connector (Medium) and a "Broken" connector (High).
- **Proactive Remediation:** For every finding, suggest a "Next Step" (e.g., "Re-run setup tests for connector X").
