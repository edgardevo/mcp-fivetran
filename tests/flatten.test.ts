import { describe, it, expect } from "vitest";
import { flatten } from "../src/custom_tools.js";

describe("flatten", () => {
    it("flattens nested objects with dot notation", () => {
        const input = { a: { b: { c: 1 } }, d: 2 };
        expect(flatten(input)).toEqual({ "a.b.c": 1, d: 2 });
    });

    it("joins arrays of primitives with semicolons", () => {
        const input = { tags: ["x", "y", "z"] };
        expect(flatten(input)).toEqual({ tags: "x;y;z" });
    });

    it("JSON-stringifies arrays of objects", () => {
        const input = { items: [{ id: 1 }, { id: 2 }] };
        expect(flatten(input)).toEqual({ items: '[{"id":1},{"id":2}]' });
    });

    it("handles a connection-like payload (regression for audit CSV)", () => {
        const input = {
            id: "conn_1",
            status: { sync_state: "scheduled", setup_state: "connected" },
            paused: false,
        };
        expect(flatten(input)).toEqual({
            id: "conn_1",
            "status.sync_state": "scheduled",
            "status.setup_state": "connected",
            paused: false,
        });
    });

    it("represents empty nested objects as {}", () => {
        const input = { a: {} };
        expect(flatten(input)).toEqual({ a: {} });
    });
});
