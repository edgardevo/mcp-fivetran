import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeCensusRequest } from "./common.js";

export function registerCensusTools(server: McpServer) {
    server.tool(
        "activations_list_workspaces",
        "Returns a list of Census workspaces in the organization.",
        {},
        async () => {
            const response = await makeCensusRequest("GET", "/workspaces");
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_get_workspace",
        "Returns details for a specific Census workspace.",
        {
            workspace_id: z.string().describe("The unique identifier for the workspace.")
        },
        async ({ workspace_id }) => {
            const response = await makeCensusRequest("GET", `/workspaces/${workspace_id}`);
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_list_users",
        "Returns a list of users in the Census organization.",
        {},
        async () => {
            const response = await makeCensusRequest("GET", "/users");
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_list_syncs",
        "Returns a list of syncs in the Census workspace.",
        {
            page: z.number().optional().describe("The page number to retrieve."),
            per_page: z.number().optional().describe("The number of items per page.")
        },
        async (args) => {
            const response = await makeCensusRequest("GET", "/syncs", args);
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_get_sync",
        "Returns details for a specific Census sync.",
        {
            sync_id: z.string().describe("The unique identifier for the sync.")
        },
        async ({ sync_id }) => {
            const response = await makeCensusRequest("GET", `/syncs/${sync_id}`);
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_list_sync_runs",
        "Returns a list of sync runs in the Census workspace.",
        {
            sync_id: z.string().optional().describe("Filter by sync ID."),
            page: z.number().optional().describe("The page number to retrieve."),
            per_page: z.number().optional().describe("The number of items per page.")
        },
        async (args) => {
            const response = await makeCensusRequest("GET", "/sync_runs", args);
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_get_sync_run",
        "Returns details for a specific Census sync run.",
        {
            sync_run_id: z.string().describe("The unique identifier for the sync run.")
        },
        async ({ sync_run_id }) => {
            const response = await makeCensusRequest("GET", `/sync_runs/${sync_run_id}`);
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_list_sources",
        "Returns a list of sources in the Census workspace.",
        {},
        async () => {
            const response = await makeCensusRequest("GET", "/sources");
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );

    server.tool(
        "activations_list_destinations",
        "Returns a list of destinations in the Census workspace.",
        {},
        async () => {
            const response = await makeCensusRequest("GET", "/destinations");
            return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
        }
    );
}
