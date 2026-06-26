import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";
process.env.CENSUS_API_KEY = "test-census-key";

// Stub only the network function; keep the real toToolResult.
vi.mock("../src/common.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/common.js")>();
    return { ...actual, makeCensusRequest: vi.fn() };
});

const { makeCensusRequest } = await import("../src/common.js");
const { registerCensusTools } = await import("../src/census_tools.js");

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

describe("registerCensusTools", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeCensusRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCensusTools(server as any);
            return { handlers };
        })());
    });

    it("registers all 9 Census activation tools", () => {
        expect(handlers.size).toBe(9);
    });

    it("interpolates the workspace id path param", async () => {
        vi.mocked(makeCensusRequest).mockResolvedValue({ data: { id: "ws_1" } });

        const response = await handlers.get("activations_get_workspace")!({ workspace_id: "ws_1" });

        expect(makeCensusRequest).toHaveBeenCalledWith("GET", "/workspaces/ws_1");
        expect(JSON.parse(response.content[0].text).data.id).toBe("ws_1");
    });

    it("passes paging args through as query params", async () => {
        vi.mocked(makeCensusRequest).mockResolvedValue({ data: [] });

        await handlers.get("activations_list_syncs")!({ page: 2, per_page: 50 });

        expect(makeCensusRequest).toHaveBeenCalledWith("GET", "/syncs", { page: 2, per_page: 50 });
    });

    it("flags errors with isError via toToolResult", async () => {
        vi.mocked(makeCensusRequest).mockResolvedValue({ error: "Census HTTP Error: 401 - unauthorized" });

        const response = await handlers.get("activations_list_workspaces")!({});

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toMatch(/401/);
    });
});
