import { describe, it, expect } from "vitest";

process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";

const { toToolResult } = await import("../src/common.js");

describe("toToolResult", () => {
    it("serializes a successful response without isError", () => {
        const result = toToolResult({ data: { id: "acc_1" } });
        expect(result.isError).toBeUndefined();
        expect(JSON.parse(result.content[0].text)).toEqual({ data: { id: "acc_1" } });
    });

    it("flags responses carrying an error with isError: true", () => {
        const result = toToolResult({ error: "HTTP Error: 404 - not found" });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toMatch(/404/);
    });

    it("always emits a single text content block of type 'text'", () => {
        const result = toToolResult({ data: [] });
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe("text");
    });
});
