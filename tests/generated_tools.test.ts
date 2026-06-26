import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";

// Stub only the network function; keep the real toToolResult.
vi.mock("../src/common.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/common.js")>();
    return { ...actual, makeRequest: vi.fn() };
});

const { makeRequest } = await import("../src/common.js");
const { registerGeneratedTools } = await import("../src/generated_tools.js");

type Handler = (args: any) => Promise<any>;

function buildServer() {
    const handlers = new Map<string, Handler>();
    const server = {
        tool: vi.fn((name: string, _desc: string, _schema: any, cb: Handler) => {
            handlers.set(name, cb);
            return { name } as any;
        }),
    };
    return { server, handlers };
}

describe("registerGeneratedTools", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerGeneratedTools(server as any);
            return { handlers };
        })());
    });

    it("registers all 63 generated read-only tools", () => {
        expect(handlers.size).toBe(63);
    });

    it("interpolates path parameters (group_details → GET /groups/{id})", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { id: "grp_1" } });

        const response = await handlers.get("group_details")!({ groupid: "grp_1" });

        expect(makeRequest).toHaveBeenCalledWith("GET", "/groups/grp_1");
        expect(JSON.parse(response.content[0].text).data.id).toBe("grp_1");
    });

    it("builds query params and omits undefined ones", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { items: [] } });

        await handlers.get("get_user_memberships_in_groups")!({ userid: "u1", limit: 50 });

        expect(makeRequest).toHaveBeenCalledWith("GET", "/users/u1/groups", { limit: 50 });
        const [, , params] = vi.mocked(makeRequest).mock.calls[0];
        expect(params).not.toHaveProperty("cursor");
    });

    it("flags errors with isError via toToolResult", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ error: "HTTP Error: 404 - not found" });

        const response = await handlers.get("group_details")!({ groupid: "missing" });

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toMatch(/404/);
    });
});
