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

const MAX_RATE_LIMIT_RETRIES = 3;

const SENSITIVE_EXACT = new Set<string>([
    "password", "passwd", "pwd",
    "secret", "secrets",
    "token", "tokens",
    "credential", "credentials",
    "api_key", "apikey",
    "private_key", "privatekey",
    "access_token", "refresh_token", "auth_token", "bearer_token", "id_token", "session_token",
    "client_secret",
    "private_certificate",
    "passphrase",
    "authorization",
    "encryption_key",
    "key",
]);

const SENSITIVE_SUFFIXES = [
    "_password", "_passwd", "_pwd",
    "_secret",
    "_token",
    "_credentials", "_credential",
    "_key",
    "_passphrase",
];

export function isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    if (SENSITIVE_EXACT.has(lower)) return true;
    return SENSITIVE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

export function redactSensitiveData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(redactSensitiveData);
    } else if (data && typeof data === "object") {
        const newData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (isSensitiveKey(key)) {
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
    body?: any,
    retryCount: number = 0
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
            if (retryCount >= MAX_RATE_LIMIT_RETRIES) {
                return { error: `HTTP Error: 429 - Rate limited; gave up after ${MAX_RATE_LIMIT_RETRIES} retries.` };
            }
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`Rate limited. Retrying after ${retryAfter}s (attempt ${retryCount + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeRequest(method, endpoint, params, body, retryCount + 1);
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
    body?: any,
    retryCount: number = 0
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
            if (retryCount >= MAX_RATE_LIMIT_RETRIES) {
                return { error: `Census HTTP Error: 429 - Rate limited; gave up after ${MAX_RATE_LIMIT_RETRIES} retries.` };
            }
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`Census API Rate limited. Retrying after ${retryAfter}s (attempt ${retryCount + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeCensusRequest(method, endpoint, params, body, retryCount + 1);
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
