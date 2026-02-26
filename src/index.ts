import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGeneratedTools } from "./generated_tools.js";
import { registerCustomTools } from "./custom_tools.js";
import { makeRequest } from "./common.js";

async function main() {
    console.error("Starting Fivetran Gemini CLI Extension...");

    // Health check
    try {
        const result = await makeRequest("GET", "/account/info");
        if (result.error) {
            console.error(`Startup failed: ${result.error}`);
            if (result.error.includes("401")) {
                console.error("Authentication failed: Please check FIVETRAN_API_KEY and FIVETRAN_API_SECRET.");
            }
            process.exit(1);
        }
        const accountId = result.data?.id || "Unknown";
        console.error(`Connection to Fivetran established. Account ID: ${accountId}`);
    } catch (error: any) {
        console.error(`Startup check exception: ${error.message}`);
        process.exit(1);
    }

    // Initialize Server
    const server = new McpServer({
        name: "dgc-fivetran",
        version: "0.4.0",
    });

    registerGeneratedTools(server);
    registerCustomTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Fivetran MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
});
