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
        "get_next_page",
        "Fetches the next page of results for a Fivetran endpoint.",
        {
            endpoint: z.string().describe("The API endpoint (e.g., '/groups')"),
            cursor: z.string().describe("The cursor value for the next page"),
            limit: z.number().optional().default(100).describe("Number of records to fetch"),
        },
        async ({ endpoint, cursor, limit }) => {
            return await makeRequest("GET", endpoint, { cursor, limit });
        }
    );

    server.tool(
        "export_fivetran_data",
        "Exports data from a Fivetran endpoint to a CSV file. Automatically handles pagination.",
        {
            endpoint: z.string().describe("The API endpoint to export (e.g., '/users')"),
            limit: z.number().optional().default(1000).describe("Safety limit on total pages"),
        },
        async ({ endpoint, limit }) => {
            let allItems: any[] = [];
            let cursor: string | null = null;
            let pageCount = 0;

            console.error(`Starting export for ${endpoint}...`);

            // Initial request
            let response = await makeRequest("GET", endpoint, { limit: 100 });
            if (response.error) {
                return { content: [{ type: "text", text: `Export failed: ${response.error}` }] };
            }

            let data = response.data || {};
            // Handle list vs dict response
            let items = Array.isArray(data.items) ? data.items : (data ? [data] : []);
            if (!Array.isArray(data.items) && !data.items && Array.isArray(data)) {
                // Some endpoints might return array directly? Fivetran usually returns { data: { items: [] } } or { data: {} }
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

            // Flatten
            console.error(`Flattening ${allItems.length} records...`);
            const flatItems = allItems.map(i => flatten(i));

            // Create exports dir
            const exportDir = path.join(process.cwd(), "exports");
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // Filename
            const sanitizedEndpoint = endpoint.replace(/^\//, "").replace(/\//g, "_");
            const timestamp = Math.floor(Date.now() / 1000);
            const filename = `${sanitizedEndpoint}_${timestamp}.csv`;
            const filepath = path.join(exportDir, filename);

            // Write CSV
            const csvOutput = stringify(flatItems, { header: true });
            fs.writeFileSync(filepath, csvOutput);

            return {
                content: [
                    {
                        type: "text",
                        text: `Export successful! File saved to: ${filepath}\nRows exported: ${allItems.length}`,
                    },
                ],
            };
        }
    );
}
