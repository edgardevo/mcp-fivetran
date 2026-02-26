# Fivetran Audit Templates

Standardized report formats for Fivetran auditing.

## Executive Audit Summary

For leadership and IT managers needing a high-level overview:

```markdown
# Fivetran Account Audit - [Date]
**Overall Status:** 🟢 Healthy | 🟡 Warning | 🔴 Critical

## Key Findings
- **Total Connectors:** [Number]
- **Active & Syncing:** [Number]
- **Failed/Broken:** [Number]
- **Unused/Paused:** [Number]

## Security Findings
- **Secrets Redaction:** ✅ All confirmed redacted / ❌ Unmasked secrets found in [IDs]
- **Role Exposure:** [Summary of users with broad admin access]

## Critical Action Items
1. **[Action Item 1]** - [Impact]
2. **[Action Item 2]** - [Impact]
```

## Detailed Connector Health Report

For data engineers and system admins:

```markdown
# Detailed Connector Breakdown
**Reporting Period:** Last 24 Hours

| Connector ID | Service | Status | Last Sync | Setup Tests |
| :--- | :--- | :--- | :--- | :--- |
| [ID-123] | Salesforce | 🟢 Success | 2h ago | ✅ Passed |
| [ID-456] | Postgres | 🔴 Broken | 1d ago | ❌ SSH Failed |
| [ID-789] | HubSpot | 🟡 Paused | N/A | ⚪ Not Run |

### Remediation Plan
- **ID-456 (Postgres):** Investigation shows SSH tunnel is unreachable. **Next Step:** Verify whitelist on source DB.
- **ID-789 (HubSpot):** Connector has been paused for 14 days. **Next Step:** Verify if this is still needed or delete.
```

## Destination Security Review

```markdown
# Destination Audit
**Target:** [Destination Name]

- **Connection Status:** [Healthy/Error]
- **Redaction Check:** [Redacted/Unmasked]
- **Data Lineage:** Receives data from [Number] connectors across [Number] services.
```
