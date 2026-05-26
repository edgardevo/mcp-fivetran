import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Set required env vars BEFORE importing common so it doesn't warn / short-circuit.
process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";
process.env.CENSUS_API_KEY = "test-census-key";

const { makeRequest, makeCensusRequest } = await import("../src/common.js");

function rateLimitedResponse(): Response {
    return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "0" },
    });
}

describe("makeRequest retry behavior", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it("gives up after MAX_RATE_LIMIT_RETRIES (3) on persistent 429s", async () => {
        fetchSpy.mockImplementation(async () => rateLimitedResponse());

        const result = await makeRequest("GET", "/test");

        // initial attempt + 3 retries = 4 calls total
        expect(fetchSpy).toHaveBeenCalledTimes(4);
        expect(result.error).toMatch(/Rate limited/i);
        expect(result.error).toMatch(/3 retries/);
    });

    it("succeeds on first try when API returns 200", async () => {
        fetchSpy.mockImplementation(async () =>
            new Response(JSON.stringify({ data: { id: "acc_1" } }), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        );

        const result = await makeRequest("GET", "/account/info");

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.data.id).toBe("acc_1");
    });

    it("recovers if 429 clears before max retries", async () => {
        let calls = 0;
        fetchSpy.mockImplementation(async () => {
            calls++;
            if (calls < 3) return rateLimitedResponse();
            return new Response(JSON.stringify({ data: "ok" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const result = await makeRequest("GET", "/test");

        expect(fetchSpy).toHaveBeenCalledTimes(3);
        expect(result.data).toBe("ok");
    });

    it("returns non-429 HTTP errors without retrying", async () => {
        fetchSpy.mockImplementation(async () =>
            new Response("not found", { status: 404 }),
        );

        const result = await makeRequest("GET", "/missing");

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.error).toMatch(/404/);
    });

    it("redacts sensitive fields in the response body", async () => {
        fetchSpy.mockImplementation(async () =>
            new Response(
                JSON.stringify({ data: { api_key: "leaked", auth_type: "oauth" } }),
                { status: 200, headers: { "content-type": "application/json" } },
            ),
        );

        const result = await makeRequest("GET", "/test");

        expect(result.data.api_key).toBe("[REDACTED]");
        expect(result.data.auth_type).toBe("oauth");
    });
});

describe("makeCensusRequest retry behavior", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it("gives up after 3 retries on persistent 429s", async () => {
        fetchSpy.mockImplementation(async () => rateLimitedResponse());

        const result = await makeCensusRequest("GET", "/workspaces");

        expect(fetchSpy).toHaveBeenCalledTimes(4);
        expect(result.error).toMatch(/Rate limited/i);
    });
});
