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
const REQUEST_TIMEOUT_MS = 30_000;

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

type ApiRequestOpts = {
    baseUrl: string;
    acceptHeader: string;
    authHeader?: string;
    errorPrefix: string;
    requestFailedPrefix: string;
    rateLimitLogPrefix: string;
    handleBinary: boolean;
};

export type ApiResponse = {
    error?: string;
    data?: any;
    [k: string]: any;
};

async function makeApiRequest(
    method: string,
    endpoint: string,
    opts: ApiRequestOpts,
    params?: Record<string, any>,
    body?: any,
    retryCount: number = 0
): Promise<ApiResponse> {
    const url = new URL(
        endpoint.startsWith("http") ? endpoint : `${opts.baseUrl}${endpoint}`
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
        Accept: opts.acceptHeader,
    };

    if (opts.authHeader) {
        headers["Authorization"] = opts.authHeader;
    }

    const options: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url.toString(), options);

        if (response.status === 429) {
            if (retryCount >= MAX_RATE_LIMIT_RETRIES) {
                return { error: `${opts.errorPrefix}: 429 - Rate limited; gave up after ${MAX_RATE_LIMIT_RETRIES} retries.` };
            }
            const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
            console.error(`${opts.rateLimitLogPrefix} Retrying after ${retryAfter}s (attempt ${retryCount + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return makeApiRequest(method, endpoint, opts, params, body, retryCount + 1);
        }

        if (!response.ok) {
            const text = await response.text();
            return {
                error: `${opts.errorPrefix}: ${response.status} - ${text}`
            };
        }

        if (opts.handleBinary) {
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
        }

        const data = await response.json();
        return redactSensitiveData(data);
    } catch (error: any) {
        if (error?.name === "TimeoutError") {
            return { error: `${opts.requestFailedPrefix}: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s` };
        }
        return { error: `${opts.requestFailedPrefix}: ${error.message}` };
    }
}

export async function makeRequest(
    method: string,
    endpoint: string,
    params?: Record<string, any>,
    body?: any,
    retryCount: number = 0
): Promise<ApiResponse> {
    const authHeader = (API_KEY && API_SECRET)
        ? `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64")}`
        : undefined;

    return makeApiRequest(
        method,
        endpoint,
        {
            baseUrl: BASE_URL,
            acceptHeader: "application/json;version=2",
            authHeader,
            errorPrefix: "HTTP Error",
            requestFailedPrefix: "Request failed",
            rateLimitLogPrefix: "Rate limited.",
            handleBinary: true,
        },
        params,
        body,
        retryCount,
    );
}

/**
 * Wraps an API response in the MCP tool-result shape, flagging `isError: true`
 * when the response carries an `.error` so the host/model can distinguish a
 * failure from real data.
 */
export function toToolResult(response: any): { content: { type: "text"; text: string }[]; isError?: boolean } {
    const text = typeof response === "string" ? response : JSON.stringify(response, null, 2);
    const result: { content: { type: "text"; text: string }[]; isError?: boolean } = {
        content: [{ type: "text", text }],
    };
    if (response && typeof response === "object" && response.error) {
        result.isError = true;
    }
    return result;
}

export type PaginatedResult =
    | { items: any[]; pages: number; truncated: boolean }
    | { error: string };

/**
 * Fetches every page of a cursor-paginated Fivetran list endpoint, following
 * `data.next_cursor` until exhausted. Fails loud: if any page errors, the error
 * is returned instead of a silently-partial result (important for audit tools).
 */
export async function fetchAllPages(
    endpoint: string,
    params: Record<string, any> = {},
    opts: { pageSize?: number; maxPages?: number } = {}
): Promise<PaginatedResult> {
    const pageSize = opts.pageSize ?? 100;
    const maxPages = opts.maxPages ?? 1000;

    const items: any[] = [];
    let cursor: string | undefined;
    let pages = 0;

    while (pages < maxPages) {
        const pageParams = { ...params, limit: pageSize, ...(cursor ? { cursor } : {}) };
        const response = await makeRequest("GET", endpoint, pageParams);
        if (response.error) {
            return { error: response.error };
        }
        pages++;

        const data = response.data || {};
        const pageItems = Array.isArray(data.items) ? data.items : [];
        items.push(...pageItems);

        cursor = data.next_cursor || undefined;
        if (!cursor) {
            return { items, pages, truncated: false };
        }
    }

    return { items, pages, truncated: true };
}

export async function makeCensusRequest(
    method: string,
    endpoint: string,
    params?: Record<string, any>,
    body?: any,
    retryCount: number = 0
): Promise<ApiResponse> {
    if (!CENSUS_API_KEY) {
        return { error: "CENSUS_API_KEY environment variable is missing." };
    }

    return makeApiRequest(
        method,
        endpoint,
        {
            baseUrl: CENSUS_BASE_URL,
            acceptHeader: "application/json",
            authHeader: `Bearer ${CENSUS_API_KEY}`,
            errorPrefix: "Census HTTP Error",
            requestFailedPrefix: "Census request failed",
            rateLimitLogPrefix: "Census API Rate limited.",
            handleBinary: false,
        },
        params,
        body,
        retryCount,
    );
}
