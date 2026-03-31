import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIVETRAN_API_KEY;
const API_SECRET = process.env.FIVETRAN_API_SECRET;
const BASE_URL = "https://api.fivetran.com/v1";
const CENSUS_BASE_URL = "https://app.getcensus.com/api/v1";

const CENSUS_API_KEY = process.env.CENSUS_API_KEY; // Personal Access Token or Workspace API Key

if (!API_KEY || !API_SECRET) {
    console.warn("Warning: FIVETRAN_API_KEY and FIVETRAN_API_SECRET are not set. Standard Fivetran tools will fail.");
}

if (!CENSUS_API_KEY) {
    console.warn("Warning: CENSUS_API_KEY is not set. Activations (Census) tools will fail.");
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
    params?: Record<string, any>,
    body?: any
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

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json;version=2", // Fivetran recommends api versioning
    };

    if (API_KEY && API_SECRET) {
        headers["Authorization"] = `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64")}`;
    }

    const options: RequestInit = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url.toString(), options);

        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`Rate limited. Retrying after ${retryAfter}s...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeRequest(method, endpoint, params, body);
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

export async function makeCensusRequest(
    method: string,
    endpoint: string,
    params?: Record<string, any>,
    body?: any
): Promise<any> {
    const url = new URL(
        endpoint.startsWith("http") ? endpoint : `${CENSUS_BASE_URL}${endpoint}`
    );

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }
    }

    if (!CENSUS_API_KEY) {
        return { error: "CENSUS_API_KEY environment variable is missing." };
    }

    const headers: Record<string, string> = {
        "Authorization": `Bearer ${CENSUS_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
    };

    const options: RequestInit = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url.toString(), options);

        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`Census API Rate limited. Retrying after ${retryAfter}s...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeCensusRequest(method, endpoint, params, body);
        }

        if (!response.ok) {
            const text = await response.text();
            return {
                error: `Census HTTP Error: ${response.status} - ${text}`
            };
        }

        const data = await response.json();
        return redactSensitiveData(data);
    } catch (error: any) {
        return { error: `Census request failed: ${error.message}` };
    }
}
