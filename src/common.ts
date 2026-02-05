import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIVETRAN_API_KEY;
const API_SECRET = process.env.FIVETRAN_API_SECRET;
const BASE_URL = "https://api.fivetran.com/v1";

if (!API_KEY || !API_SECRET) {
    console.error("Error: FIVETRAN_API_KEY and FIVETRAN_API_SECRET must be set.");
    process.exit(1);
}

const SENSITIVE_KEYS = ["password", "secret", "key", "token", "cert", "credential", "auth", "private"];

function redactSensitiveData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(redactSensitiveData);
    } else if (data && typeof data === "object") {
        const newData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
                newData[key] = "[REDACTED]";
            } else {
                newData[key] = redactSensitiveData(value);
            }
        }
        return newData;
    }
    return data;
}

export async function makeRequest(
    method: string,
    endpoint: string,
    params?: Record<string, any>
): Promise<any> {
    const url = new URL(
        endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`
    );

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }
    }

    const headers = {
        Authorization: `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString(
            "base64"
        )}`,
        "Content-Type": "application/json",
        Accept: "application/json;version=2", // Fivetran recommends api versioning
    };

    try {
        const response = await fetch(url.toString(), {
            method,
            headers,
        });

        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`Rate limited. Retrying after ${retryAfter}s...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeRequest(method, endpoint, params);
        }

        if (!response.ok) {
            const text = await response.text();
            return {
                error: `HTTP Error: ${response.status} - ${text}`
            };
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/octet-stream") || contentType.includes("zip")) {
            const buffer = await response.arrayBuffer();
            return {
                message: "Binary data received (ZIP file).",
                size: buffer.byteLength,
                contentType: contentType,
                info: "Binary data cannot be displayed directly in the chat context."
            };
        }

        const data = await response.json();
        return redactSensitiveData(data);
    } catch (error: any) {
        return { error: `Request failed: ${error.message}` };
    }
}
