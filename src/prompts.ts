import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Reusable MCP prompts that wrap the server's audit/triage workflows. These
 * mirror the Gemini-CLI skills/commands but are exposed via the MCP prompts
 * capability so any MCP client (Claude Desktop, Claude Code, etc.) can invoke
 * them. Each prompt returns a single user message that drives the model to use
 * the read-only tools this server provides.
 */

interface PromptDef {
    name: string;
    description: string;
    text: string;
}

const PROMPTS: PromptDef[] = [
    {
        name: "fivetran_health_report",
        description: "Produce a Fivetran account health report: status breakdown and critical failures.",
        text: [
            "Generate a Fivetran account health report.",
            "",
            "1. Call `get_account_health_summary` for the overall status breakdown and critical issues.",
            "2. Call `analyze_connector_issues` to detail broken/failed connectors (errors, failed setup tests).",
            "3. Summarize: total connectors, counts by sync state, and a prioritized list of connectors needing attention with their most recent error.",
            "Keep it concise and action-oriented; do not invent data not returned by the tools.",
        ].join("\n"),
    },
    {
        name: "fivetran_security_audit",
        description: "Audit account access, connector auth, and destinations for security review.",
        text: [
            "Perform a Fivetran security audit.",
            "",
            "1. Use `get_lineage_report` to enumerate every source→destination flow.",
            "2. Use `export_audit_report` to capture connections, users, teams, and roles (note: secrets are redacted by the server).",
            "3. Review for: connectors using password/secret auth vs. managed auth, destinations by region, and over-broad access.",
            "4. Report findings grouped by severity. Never attempt to reveal redacted credential values.",
        ].join("\n"),
    },
    {
        name: "fivetran_sync_triage",
        description: "Diagnose and triage broken or failing connector syncs.",
        text: [
            "Triage failing Fivetran connector syncs.",
            "",
            "1. Call `analyze_connector_issues` to list connectors in a broken/failed state.",
            "2. For a specific connector, use `get_connector_details` and `get_connector_schema` to inspect configuration and setup-test results.",
            "3. For each issue, state the likely cause and a concrete next step. If a write tool would remediate it (e.g. `run_connection_tests`), recommend it but do not run it unless asked.",
        ].join("\n"),
    },
    {
        name: "fivetran_lineage_overview",
        description: "Map connectors to destinations for a source-to-sink lineage overview.",
        text: [
            "Produce a Fivetran data lineage overview.",
            "",
            "1. Call `get_lineage_report` to map every connector to its destination.",
            "2. Optionally use `find_connector_by_table` to locate which connector syncs a specific table.",
            "3. Present the lineage grouped by destination, noting source service and region for each connector.",
        ].join("\n"),
    },
];

export function registerPrompts(server: McpServer) {
    for (const p of PROMPTS) {
        server.prompt(p.name, p.description, async () => ({
            messages: [
                { role: "user", content: { type: "text", text: p.text } },
            ],
        }));
    }
}
