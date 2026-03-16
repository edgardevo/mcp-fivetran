import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { stringify } from "csv-stringify/sync";
import { makeRequest } from "./common.js";

// Helper to flatten JSON
function flattenJson(y: any, name: string = ""): Record<string, any> {
    let out: Record<string, any> = {};

    if (y && typeof y === "object" && !Array.isArray(y)) {
        for (const idx in y) {
            const newName = name ? `${name}.${idx}` : idx;
            const value = y[idx];
            if (typeof value === 'object' && value !== null) {
                const flattened = flattenJson(value, newName);
                out = { ...out, ...flattened };
            } else {
                out[newName] = value;
            }
        }
    } else if (Array.isArray(y)) {
        // For arrays, stringify or join
        if (y.length > 0 && typeof y[0] === 'object') {
            out[name] = JSON.stringify(y);
        } else {
            out[name] = y.join(';');
        }
    } else {
        out[name] = y;
    }
    return out;
}

// Better flattening function that handles the recursion correctly for dot notation
function flatten(data: any): Record<string, any> {
    const result: Record<string, any> = {};

    function recurse(cur: any, prop: string) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            // Handle array: if objects, json dump, else join
            if (cur.length > 0 && typeof cur[0] === 'object') {
                result[prop] = JSON.stringify(cur);
            } else {
                result[prop] = cur.join(';');
            }
        } else {
            let isEmpty = true;
            for (const p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "." + p : p);
            }
            if (isEmpty && prop) {
                result[prop] = {};
            }
        }
    }
    recurse(data, "");
    return result;
}


export function registerCustomTools(server: McpServer) {
    server.tool(
        "test_connection",
        "Tests the connection to the Fivetran API using the FIVETRAN_API_KEY and FIVETRAN_API_SECRET environment variables. Returns the account ID if successful.",
        {},
        async () => {
            if (!process.env.FIVETRAN_API_KEY || !process.env.FIVETRAN_API_SECRET) {
                return {
                    content: [{ type: "text", text: "Connection Test Failed: FIVETRAN_API_KEY or FIVETRAN_API_SECRET environment variables are missing." }],
                    isError: true,
                };
            }
            const response = await makeRequest("GET", "/account/info");
            if (response.error) {
                return {
                    content: [{ type: "text", text: `Connection Test Failed: ${response.error}` }],
                    isError: true,
                };
            }
            return {
                content: [{
                    type: "text",
                    text: `Connection Successful! Account ID: ${response.data?.id || "Unknown"}\nAccount Name: ${response.data?.name || "N/A"}`
                }],
            };
        }
    );

    server.tool(
        "export_audit_report",
        "Generates a comprehensive audit report consisting of multiple CSV files (connections, users, teams, roles).",
        {},
        async () => {
            console.error("Starting full audit export...");
            const exportDir = path.join(process.cwd(), "exports", `audit_${Math.floor(Date.now() / 1000)}`);
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            const reports = [];

            // 1. Roles Audit
            console.error("Exporting Roles...");
            const rolesResp = await makeRequest("GET", "/roles");
            if (!rolesResp.error) {
                const roles = rolesResp.data?.items || [];
                const filepath = path.join(exportDir, "roles.csv");
                fs.writeFileSync(filepath, stringify(roles.map((r: any) => flatten(r)), { header: true }));
                reports.push(`Roles: ${roles.length} exported to roles.csv`);
            }

            // 2. Teams Audit
            console.error("Exporting Teams...");
            const teamsResp = await makeRequest("GET", "/teams");
            if (!teamsResp.error) {
                const teams = teamsResp.data?.items || [];
                const filepath = path.join(exportDir, "teams.csv");
                fs.writeFileSync(filepath, stringify(teams.map((t: any) => flatten(t)), { header: true }));
                reports.push(`Teams: ${teams.length} exported to teams.csv`);
            }

            // 3. Users Audit
            console.error("Exporting Users...");
            const usersResp = await makeRequest("GET", "/users");
            if (!usersResp.error) {
                const users = usersResp.data?.items || [];
                // User objects in Fivetran API v2 include 'role' and 'logged_in_at'
                const filepath = path.join(exportDir, "users.csv");
                fs.writeFileSync(filepath, stringify(users.map((u: any) => flatten(u)), { header: true }));
                reports.push(`Users: ${users.length} exported to users.csv`);
            }

            // 4. Connections & Destinations Audit (Joined)
            console.error("Exporting Connections Audit...");
            const connectionsResp = await makeRequest("GET", "/connections");
            const destinationsResp = await makeRequest("GET", "/destinations");

            if (!connectionsResp.error && !destinationsResp.error) {
                const connections = connectionsResp.data?.items || [];
                const destinations = destinationsResp.data?.items || [];
                const destMap: Record<string, any> = {};
                destinations.forEach((d: any) => { destMap[d.id] = d; });

                const connectionAudit = connections.map((c: any) => {
                    const dest = destMap[c.group_id] || {};

                    // Try to infer authentication type from config
                    const sourceAuthType = c.config?.auth_type || c.config?.authentication_type || (c.config?.password ? "Password/Secret" : (c.config?.api_key ? "API Key" : "Unknown"));
                    const destAuthType = dest.config?.auth_type || dest.config?.authentication_type || (dest.config?.password ? "Password/Secret" : (dest.config?.api_key ? "API Key" : "Unknown"));

                    return flatten({
                        connection_id: c.id,
                        connection_name: c.schema,
                        connection_type: c.service,
                        source_service: c.service,
                        paused: c.paused,
                        sync_frequency: c.sync_frequency,
                        sync_state: c.status?.sync_state,
                        setup_state: c.status?.setup_state,
                        succeeded_at: c.succeeded_at,
                        failed_at: c.failed_at,
                        source_authentication_type: sourceAuthType,
                        destination_id: c.group_id,
                        destination_name: dest.schema || "Unknown",
                        destination_service: dest.service || "Unknown",
                        destination_region: dest.region || "Unknown",
                        destination_authentication_type: destAuthType,
                        networking_method: c.networking_method,
                        // Note: Fivetran API v2 doesn't always expose volume/cost directly in the connection list.
                        // We include placeholders for relevance markers.
                        daily_sync_time: c.daily_sync_time,
                        schedule_type: c.schedule_type,
                        is_historical_sync: c.status?.is_historical_sync
                    });
                });

                const filepath = path.join(exportDir, "connections_audit.csv");
                fs.writeFileSync(filepath, stringify(connectionAudit, { header: true }));
                reports.push(`Connections Audit: ${connections.length} records exported to connections_audit.csv`);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `Audit Export Complete!\nLocation: ${exportDir}\n\nSummary:\n- ${reports.join("\n- ")}`,
                    },
                ],
            };
        }
    );

    server.tool(
        "get_next_page",
        "Fetches the next page of results for a Fivetran endpoint.",
        {
            endpoint: z.string().describe("The API endpoint (e.g., '/groups')"),
            cursor: z.string().describe("The cursor value for the next page"),
            limit: z.number().optional().default(100).describe("Number of records to fetch"),
        },
        async ({ endpoint, cursor, limit }) => {
            const response = await makeRequest("GET", endpoint, { cursor, limit });
            return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "export_fivetran_data",
        "Exports data from a Fivetran endpoint to a file (CSV or JSON). Automatically handles pagination.",
        {
            endpoint: z.string().describe("The API endpoint to export (e.g., '/users')"),
            limit: z.number().optional().default(1000).describe("Safety limit on total pages"),
            format: z.enum(["csv", "json"]).optional().default("csv").describe("The export format: 'csv' or 'json'"),
        },
        async ({ endpoint, limit, format }) => {
            let allItems: any[] = [];
            let cursor: string | null = null;
            let pageCount = 0;

            console.error(`Starting ${format} export for ${endpoint}...`);

            // Initial request
            let response = await makeRequest("GET", endpoint, { limit: 100 });
            if (response.error) {
                return { content: [{ type: "text", text: `Export failed: ${response.error}` }] };
            }

            let data = response.data || {};
            // Handle list vs dict response
            let items = Array.isArray(data.items) ? data.items : (data ? [data] : []);
            if (!Array.isArray(data.items) && !data.items && Array.isArray(data)) {
                items = data;
            }

            allItems.push(...items);
            cursor = data.next_cursor || null;

            while (cursor && pageCount < limit) {
                pageCount++;
                if (pageCount % 10 === 0) {
                    console.error(`Fetching page ${pageCount}...`);
                }

                response = await makeRequest("GET", endpoint, { cursor, limit: 100 });
                if (response.error) {
                    console.error(`Warning: Error fetching page ${pageCount}: ${response.error}`);
                    break;
                }

                data = response.data || {};
                const newItems = data.items || [];
                if (newItems.length === 0) break;

                allItems.push(...newItems);
                cursor = data.next_cursor;
            }

            if (allItems.length === 0) {
                return { content: [{ type: "text", text: "No data found to export." }] };
            }

            // Create exports dir
            const exportDir = path.join(process.cwd(), "exports");
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // Filename
            const sanitizedEndpoint = endpoint.replace(/^\//, "").replace(/\//g, "_");
            const timestamp = Math.floor(Date.now() / 1000);
            const filename = `${sanitizedEndpoint}_${timestamp}.${format}`;
            const filepath = path.join(exportDir, filename);

            let fileContent: string;
            if (format === "csv") {
                console.error(`Flattening ${allItems.length} records for CSV...`);
                const flatItems = allItems.map(i => flatten(i));
                fileContent = stringify(flatItems, { header: true });
            } else {
                fileContent = JSON.stringify(allItems, null, 2);
            }

            fs.writeFileSync(filepath, fileContent);

            return {
                content: [
                    {
                        type: "text",
                        text: `Export successful! File saved to: ${filepath}\nRows exported: ${allItems.length}\nFormat: ${format}`,
                    },
                ],
            };
        }
    );

    // --- Aliases to support Skill nomenclature ---

    server.tool(
        "get_connector_details",
        "Alias for connection_details. Retrieve detailed information about a specific connector.",
        {
            connector_id: z.string().describe("The unique identifier for the connector.")
        },
        async ({ connector_id }) => {
            const response = await makeRequest("GET", `/connections/${connector_id}`);
            return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "list_connectors",
        "Alias for list_all_connections. List all connectors in the Fivetran account.",
        {
            group_id: z.string().optional().describe("Filter by group ID"),
            cursor: z.string().optional().describe("Pagination cursor"),
            limit: z.number().optional().describe("Records per page")
        },
        async (args) => {
            const response = await makeRequest("GET", "/connections", args);
            if (response.error || !response.data?.items) {
                return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
            }

            // Format output nicely and prevent LLM context overflow by limiting returned keys
            response.data.items = response.data.items.map((c: any) => ({
                id: c.id,
                group_id: c.group_id,
                service: c.service,
                schema: c.schema,
                paused: c.paused,
                sync_state: c.status?.sync_state,
                setup_state: c.status?.setup_state,
                last_successful_sync: c.succeeded_at,
                last_failed_sync: c.failed_at
            }));

            return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "get_connector_schema",
        "Alias for connection_schema_config. Retrieve the schema configuration for a connector.",
        {
            connector_id: z.string().describe("The unique identifier for the connector.")
        },
        async ({ connector_id }) => {
            const response = await makeRequest("GET", `/connections/${connector_id}/schemas`);
            return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "get_connector_columns",
        "Alias for connection_column_config. Retrieve column-level configuration for a specific table in a connector.",
        {
            connector_id: z.string().describe("The unique identifier for the connector."),
            schema: z.string().describe("The schema name."),
            table: z.string().describe("The table name.")
        },
        async ({ connector_id, schema, table }) => {
            const response = await makeRequest("GET", `/connections/${connector_id}/schemas/${schema}/tables/${table}/columns`);
            return { content: [{ type: "text", text: typeof response === 'string' ? response : JSON.stringify(response, null, 2) }] };
        }
    );

    // --- High-level Audit & Lineage Tools ---

    server.tool(
        "get_account_health_summary",
        "Provides a high-level summary of the Fivetran account health, counting connectors by status and identifying critical failures.",
        {},
        async () => {
            const connectionsResp = await makeRequest("GET", "/connections");
            if (connectionsResp.error) return { content: [{ type: "text", text: typeof connectionsResp === 'string' ? connectionsResp : JSON.stringify(connectionsResp, null, 2) }] };

            const items = connectionsResp.data?.items || [];
            const summary = {
                total_connectors: items.length,
                status_counts: {
                    scheduled: 0,
                    syncing: 0,
                    broken: 0,
                    paused: 0,
                    rescheduled: 0,
                    other: 0
                },
                critical_issues: [] as any[]
            };

            items.forEach((c: any) => {
                const state = (c.status?.sync_state || "other").toLowerCase();
                if (summary.status_counts.hasOwnProperty(state)) {
                    (summary.status_counts as any)[state]++;
                } else {
                    summary.status_counts.other++;
                }

                if (state === "broken" || c.status?.setup_state === "broken") {
                    summary.critical_issues.push({
                        id: c.id,
                        name: c.schema,
                        service: c.service,
                        error: c.status?.last_sync_error || "Unknown error"
                    });
                }
            });

            return {
                content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
            };
        }
    );

    server.tool(
        "get_lineage_report",
        "Maps every connector to its destination, providing a full source-to-sink data flow report.",
        {},
        async () => {
            const connectionsResp = await makeRequest("GET", "/connections");
            const destinationsResp = await makeRequest("GET", "/destinations");

            if (connectionsResp.error) return { content: [{ type: "text", text: typeof connectionsResp === 'string' ? connectionsResp : JSON.stringify(connectionsResp, null, 2) }] };
            if (destinationsResp.error) return { content: [{ type: "text", text: typeof destinationsResp === 'string' ? destinationsResp : JSON.stringify(destinationsResp, null, 2) }] };

            const connections = connectionsResp.data?.items || [];
            const destinations = destinationsResp.data?.items || [];
            const destMap: Record<string, any> = {};
            destinations.forEach((d: any) => { destMap[d.id] = d; });

            const lineage = connections.map((c: any) => {
                const dest = destMap[c.group_id] || {};
                return {
                    connector_id: c.id,
                    connector_name: c.schema,
                    source_service: c.service,
                    destination_id: c.group_id,
                    destination_name: dest.schema || "Unknown",
                    destination_service: dest.service || "Unknown",
                    region: dest.region
                };
            });

            return {
                content: [{ type: "text", text: JSON.stringify(lineage, null, 2) }]
            };
        }
    );

    server.tool(
        "analyze_connector_issues",
        "Performs a deep-dive into connectors with high failure rates or persistent setup issues.",
        {},
        async () => {
            const connectionsResp = await makeRequest("GET", "/connections");
            if (connectionsResp.error) return { content: [{ type: "text", text: typeof connectionsResp === 'string' ? connectionsResp : JSON.stringify(connectionsResp, null, 2) }] };

            const items = connectionsResp.data?.items || [];
            const issues = items
                .filter((c: any) => c.status?.sync_state === "broken" || c.status?.setup_state === "broken" || c.failed_at)
                .map((c: any) => ({
                    id: c.id,
                    name: c.schema,
                    service: c.service,
                    sync_state: c.status?.sync_state,
                    setup_state: c.status?.setup_state,
                    last_failure: c.failed_at,
                    last_success: c.succeeded_at,
                    error_message: c.status?.last_sync_error,
                    failed_tests: (c.setup_tests || []).filter((t: any) => t.status === "FAILED")
                }));

            // Sort by most recent failure
            issues.sort((a: any, b: any) => {
                const dateA = a.last_failure ? new Date(a.last_failure).getTime() : 0;
                const dateB = b.last_failure ? new Date(b.last_failure).getTime() : 0;
                return dateB - dateA;
            });

            return {
                content: [{ type: "text", text: JSON.stringify(issues, null, 2) }]
            };
        }
    );

    server.tool(
        "find_connector_by_table",
        "Searches all connectors to find which one is responsible for syncing a specific table name. Warning: This tool may make multiple API calls and take some time.",
        {
            table_name: z.string().describe("The name of the table to search for.")
        },
        async ({ table_name }) => {
            const connectionsResp = await makeRequest("GET", "/connections");
            if (connectionsResp.error) return { content: [{ type: "text", text: typeof connectionsResp === 'string' ? connectionsResp : JSON.stringify(connectionsResp, null, 2) }] };

            const items = connectionsResp.data?.items || [];
            const results = [];

            // We filter by name first to minimize calls if possible,
            // but usually we need to check schemas.
            // For now, we'll check the first 10 active connectors to be safe,
            // or just the ones whose schema name matches the table name or prefix.
            for (const c of items) {
                if (c.paused) continue;

                // Heuristic: check if schema config exists
                const schemaResp = await makeRequest("GET", `/connections/${c.id}/schemas`);
                if (schemaResp.error) continue;

                const schemas = schemaResp.data?.schemas || {};
                for (const schemaName in schemas) {
                    const tables = schemas[schemaName].tables || {};
                    if (tables.hasOwnProperty(table_name)) {
                        results.push({
                            connector_id: c.id,
                            connector_name: c.schema,
                            service: c.service,
                            destination_schema: schemaName,
                            table_name: table_name,
                            enabled: tables[table_name].enabled
                        });
                    }
                }

                // Limit to avoid hitting rate limits or taking too long
                if (results.length >= 5) break;
            }

            return {
                content: [{
                    type: "text",
                    text: results.length > 0
                        ? JSON.stringify(results, null, 2)
                        : `No connector found syncing table: ${table_name}`
                }]
            };
        }
    );

    server.tool(
        "create_connector",
        "Creates a new connector in the Fivetran account.",
        {
            service: z.string().describe("The specific connector service (e.g. 'postgres', 'salesforce')"),
            group_id: z.string().describe("The destination group ID"),
            config: z.any().describe("A JSON object containing the connector-specific configuration"),
            run_setup_tests: z.boolean().optional().describe("Whether to run setup tests automatically"),
            paused: z.boolean().optional().describe("Whether to create the connector in a paused state"),
            sync_frequency: z.number().optional().describe("Sync frequency in minutes")
        },
        async (args) => {
            const body = {
                service: args.service,
                group_id: args.group_id,
                config: args.config,
                run_setup_tests: args.run_setup_tests,
                paused: args.paused,
                sync_frequency: args.sync_frequency
            };
            Object.keys(body).forEach(key => (body as any)[key] === undefined && delete (body as any)[key]);

            const response = await makeRequest("POST", "/connections", undefined, body);
            return {
                content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
            };
        }
    );

    server.tool(
        "sync_connector",
        "Forces a sync for a specific connector.",
        {
            connector_id: z.string().describe("The unique identifier for the connector."),
            force: z.boolean().optional().describe("If true, forces a sync even if one is already running.")
        },
        async ({ connector_id, force }) => {
            const response = await makeRequest("POST", `/connections/${connector_id}/sync`, undefined, force !== undefined ? { force } : undefined);
            return {
                content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
            };
        }
    );

    server.tool(
        "resync_connector",
        "Triggers a full historical resync of a connector or specific tables/schemas.",
        {
            connector_id: z.string().describe("The unique identifier for the connector.")
        },
        async ({ connector_id }) => {
            const response = await makeRequest("POST", `/connections/${connector_id}/resync`);
            return {
                content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
            };
        }
    );
}
