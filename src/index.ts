import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGeneratedTools } from "./generated_tools.js";
import { registerCustomTools, isWriteEnabled } from "./custom_tools.js";
import { registerCensusTools } from "./census_tools.js";
import { makeRequest, makeCensusRequest } from "./common.js";

async function main() {
    console.error("Starting Fivetran Gemini CLI Extension...");

    // Fivetran Health check
    if (process.env.FIVETRAN_API_KEY && process.env.FIVETRAN_API_SECRET) {
        try {
            const result = await makeRequest("GET", "/account/info");
            if (result.error) {
                console.error(`Fivetran check failed: ${result.error}`);
            } else {
                const accountId = result.data?.id || "Unknown";
                console.error(`Connection to Fivetran established. Account ID: ${accountId}`);
            }
        } catch (error: any) {
            console.error(`Fivetran startup check exception: ${error.message}`);
        }
    } else {
        console.warn("FIVETRAN_API_KEY or FIVETRAN_API_SECRET missing. Fivetran tools will be unavailable.");
    }

    // Census Health check
    if (process.env.CENSUS_API_KEY) {
        try {
            const result = await makeCensusRequest("GET", "/workspaces");
            if (result.error) {
                console.error(`Census check failed: ${result.error}`);
            } else {
                console.error(`Connection to Census established.`);
            }
        } catch (error: any) {
            console.error(`Census startup check exception: ${error.message}`);
        }
    } else {
        console.warn("CENSUS_API_KEY missing. Activations (Census) tools will be unavailable.");
    }

    // Initialize Server
    const server = new McpServer({
        name: "dgc-fivetran",
        version: "0.7.0",
    });

    const allowWrites = isWriteEnabled();
    if (!allowWrites) {
        console.error("Write tools disabled. Set FIVETRAN_ALLOW_WRITES=true to enable write tools (connector create/update/delete, sync/resync, setup tests, schema/table/column config edits, schema reload/drop/resync).");
    }

    registerGeneratedTools(server);
    registerCustomTools(server, { allowWrites });
    registerCensusTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Fivetran MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
});
