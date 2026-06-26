import { describe, it, expect, vi, beforeEach } from "vitest";

const { registerPrompts } = await import("../src/prompts.js");

type PromptCb = () => Promise<any>;

function buildServer() {
    const prompts = new Map<string, { description: string; cb: PromptCb }>();
    const server = {
        prompt: vi.fn((name: string, description: string, cb: PromptCb) => {
            prompts.set(name, { description, cb });
            return {} as any;
        }),
    };
    return { server, prompts };
}

describe("registerPrompts", () => {
    let prompts: Map<string, { description: string; cb: PromptCb }>;

    beforeEach(() => {
        ({ prompts } = (() => {
            const { server, prompts } = buildServer();
            registerPrompts(server as any);
            return { prompts };
        })());
    });

    it("registers the core Fivetran workflow prompts", () => {
        expect(prompts.has("fivetran_health_report")).toBe(true);
        expect(prompts.has("fivetran_security_audit")).toBe(true);
        expect(prompts.has("fivetran_sync_triage")).toBe(true);
        expect(prompts.has("fivetran_lineage_overview")).toBe(true);
        expect(prompts.size).toBeGreaterThanOrEqual(4);
    });

    it("each prompt has a description and returns a non-empty user message", async () => {
        for (const [name, { description, cb }] of prompts) {
            expect(description.length).toBeGreaterThan(0);
            const result = await cb();
            expect(result.messages).toHaveLength(1);
            expect(result.messages[0].role).toBe("user");
            expect(result.messages[0].content.type).toBe("text");
            expect(result.messages[0].content.text.length).toBeGreaterThan(20);
            // Should reference at least one real tool name for actionability.
            expect(result.messages[0].content.text).toMatch(/get_|analyze_|export_|list_|find_/);
        }
    });
});
