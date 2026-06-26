import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Set required env vars BEFORE importing common so it doesn't warn / short-circuit.
process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";
process.env.CENSUS_API_KEY = "test-census-key";

const { fetchAllPages } = await import("../src/common.js");

function page(items: any[], nextCursor: string | null): Response {
    return new Response(
        JSON.stringify({ data: { items, next_cursor: nextCursor } }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
}

describe("fetchAllPages", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it("follows next_cursor and concatenates items across pages", async () => {
        let call = 0;
        fetchSpy.mockImplementation(async () => {
            call++;
            if (call === 1) return page([{ id: 1 }, { id: 2 }], "cursor-1");
            if (call === 2) return page([{ id: 3 }], null);
            throw new Error("unexpected extra page request");
        });

        const result = await fetchAllPages("/connections");

        if ("error" in result) throw new Error(`unexpected error: ${result.error}`);
        expect(result.items.map((i: any) => i.id)).toEqual([1, 2, 3]);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("returns the error and stops when a page fails (no silent partial)", async () => {
        let call = 0;
        fetchSpy.mockImplementation(async () => {
            call++;
            if (call === 1) return page([{ id: 1 }], "cursor-1");
            return new Response("server error", { status: 500 });
        });

        const result = await fetchAllPages("/connections");

        if (!("error" in result)) throw new Error("expected an error result");
        expect(result.error).toMatch(/500/);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("stops at maxPages and reports truncated when more pages remain", async () => {
        // Every page reports another cursor, so pagination would never end on its own.
        fetchSpy.mockImplementation(async () => page([{ id: 0 }], "always-more"));

        const result = await fetchAllPages("/connections", {}, { maxPages: 3 });

        if ("error" in result) throw new Error(`unexpected error: ${result.error}`);
        expect(result.pages).toBe(3);
        expect(result.truncated).toBe(true);
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
});
