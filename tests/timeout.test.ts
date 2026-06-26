import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";

const { makeRequest } = await import("../src/common.js");

describe("request timeout", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it("passes an AbortSignal to fetch so requests can't hang forever", async () => {
        let capturedInit: RequestInit | undefined;
        fetchSpy.mockImplementation(async (_url, init?: RequestInit) => {
            capturedInit = init;
            return new Response(JSON.stringify({ data: {} }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        await makeRequest("GET", "/account/info");

        expect(capturedInit?.signal).toBeInstanceOf(AbortSignal);
    });

    it("returns a clean timeout error when the request times out", async () => {
        fetchSpy.mockImplementation(async () => {
            throw new DOMException("The operation timed out.", "TimeoutError");
        });

        const result = await makeRequest("GET", "/account/info");

        expect(result.error).toMatch(/timed out/i);
    });
});
