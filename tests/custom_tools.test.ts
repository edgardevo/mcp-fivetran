import { describe, it, expect, vi, beforeEach } from "vitest";

// Required env so common.ts doesn't bail on import.
process.env.FIVETRAN_API_KEY = "test-key";
process.env.FIVETRAN_API_SECRET = "test-secret";

// Mock the common module so handlers go through our spy.
// Stub only the network functions; keep the real pure helpers (toToolResult, etc.).
vi.mock("../src/common.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/common.js")>();
    return {
        ...actual,
        makeRequest: vi.fn(),
        makeCensusRequest: vi.fn(),
        fetchAllPages: vi.fn(),
    };
});

// Stub fs so file-writing export tools don't touch disk.
vi.mock("fs", () => ({
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

const { makeRequest, fetchAllPages } = await import("../src/common.js");
const fs = await import("fs");
const { registerCustomTools, isWriteEnabled } = await import("../src/custom_tools.js");

const WRITE_TOOLS = [
    "create_connector",
    "update_connector",
    "sync_connector",
    "resync_connector",
    "run_connection_tests",
] as const;

type Handler = (args: any) => Promise<any>;

function buildServer() {
    const handlers = new Map<string, Handler>();
    const server = {
        tool: vi.fn((name: string, _desc: string, _schema: any, cb?: Handler) => {
            // Two-arg, three-arg and four-arg overloads exist; handler is always last fn.
            const handler = (typeof cb === "function" ? cb : _schema) as Handler;
            handlers.set(name, handler);
            return { name } as any;
        }),
    };
    return { server, handlers };
}

function asJSON(response: any): any {
    return JSON.parse(response.content[0].text);
}

describe("create_connector", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("strips undefined optional fields from the POST body", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { id: "conn_new" } });

        const handler = handlers.get("create_connector")!;
        await handler({
            service: "postgres",
            group_id: "grp_1",
            config: { host: "db.example.com" },
            // run_setup_tests, paused, sync_frequency all omitted (undefined)
        });

        expect(makeRequest).toHaveBeenCalledTimes(1);
        const [method, path, query, body] = vi.mocked(makeRequest).mock.calls[0];
        expect(method).toBe("POST");
        expect(path).toBe("/connections");
        expect(query).toBeUndefined();
        expect(body).toEqual({
            service: "postgres",
            group_id: "grp_1",
            config: { host: "db.example.com" },
        });
        expect(body).not.toHaveProperty("run_setup_tests");
        expect(body).not.toHaveProperty("paused");
        expect(body).not.toHaveProperty("sync_frequency");
    });

    it("keeps explicit false / 0 values in the POST body", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { id: "conn_new" } });

        const handler = handlers.get("create_connector")!;
        await handler({
            service: "postgres",
            group_id: "grp_1",
            config: {},
            run_setup_tests: false,
            paused: false,
            sync_frequency: 0,
        });

        const [, , , body] = vi.mocked(makeRequest).mock.calls[0];
        expect(body).toEqual({
            service: "postgres",
            group_id: "grp_1",
            config: {},
            run_setup_tests: false,
            paused: false,
            sync_frequency: 0,
        });
    });
});

describe("update_connector", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("PATCHes the connection and strips undefined optional fields", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { id: "conn_1", paused: true } });

        const handler = handlers.get("update_connector")!;
        await handler({ connector_id: "conn_1", paused: true });

        expect(makeRequest).toHaveBeenCalledTimes(1);
        const [method, path, query, body] = vi.mocked(makeRequest).mock.calls[0];
        expect(method).toBe("PATCH");
        expect(path).toBe("/connections/conn_1");
        expect(query).toBeUndefined();
        expect(body).toEqual({ paused: true });
        // connector_id is a path param, not a body field
        expect(body).not.toHaveProperty("connector_id");
        expect(body).not.toHaveProperty("sync_frequency");
    });

    it("keeps explicit false / 0 values in the PATCH body", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { id: "conn_1" } });

        const handler = handlers.get("update_connector")!;
        await handler({ connector_id: "conn_1", paused: false, sync_frequency: 0 });

        const [, , , body] = vi.mocked(makeRequest).mock.calls[0];
        expect(body).toEqual({ paused: false, sync_frequency: 0 });
    });
});

describe("run_connection_tests", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("POSTs to the connection test endpoint with no body when no flags given", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { setup_tests: [] } });

        const handler = handlers.get("run_connection_tests")!;
        await handler({ connector_id: "conn_1" });

        expect(makeRequest).toHaveBeenCalledTimes(1);
        const [method, path, query, body] = vi.mocked(makeRequest).mock.calls[0];
        expect(method).toBe("POST");
        expect(path).toBe("/connections/conn_1/test");
        expect(query).toBeUndefined();
        expect(body).toBeUndefined();
    });

    it("includes trust flags in the body when provided", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ data: { setup_tests: [] } });

        const handler = handlers.get("run_connection_tests")!;
        await handler({ connector_id: "conn_1", trust_certificates: true });

        const [, , , body] = vi.mocked(makeRequest).mock.calls[0];
        expect(body).toEqual({ trust_certificates: true });
    });
});

describe("list_connectors", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("maps responses to the trimmed key set", async () => {
        vi.mocked(makeRequest).mockResolvedValue({
            data: {
                items: [
                    {
                        id: "c1",
                        group_id: "g1",
                        service: "postgres",
                        schema: "public",
                        paused: false,
                        status: { sync_state: "scheduled", setup_state: "connected" },
                        succeeded_at: "2026-01-01T00:00:00Z",
                        failed_at: null,
                        // Extra noise that should be dropped
                        config: { password: "leak" },
                        notes: "ignore-me",
                    },
                ],
            },
        });

        const handler = handlers.get("list_connectors")!;
        const response = await handler({});
        const payload = asJSON(response);

        expect(payload.data.items).toHaveLength(1);
        expect(payload.data.items[0]).toEqual({
            id: "c1",
            group_id: "g1",
            service: "postgres",
            schema: "public",
            paused: false,
            sync_state: "scheduled",
            setup_state: "connected",
            last_successful_sync: "2026-01-01T00:00:00Z",
            last_failed_sync: null,
        });
        expect(payload.data.items[0]).not.toHaveProperty("config");
        expect(payload.data.items[0]).not.toHaveProperty("notes");
    });

    it("passes error responses through untouched", async () => {
        vi.mocked(makeRequest).mockResolvedValue({ error: "Unauthorized: 401" });

        const handler = handlers.get("list_connectors")!;
        const response = await handler({});
        const payload = asJSON(response);

        expect(payload).toEqual({ error: "Unauthorized: 401" });
        expect(response.isError).toBe(true);
    });
});

describe("get_account_health_summary", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(makeRequest).mockReset();
        vi.mocked(fetchAllPages).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("counts statuses across ALL pages and surfaces broken connectors", async () => {
        // Items spanning multiple pages — the tool must rely on fetchAllPages,
        // not a single makeRequest page, or it would undercount large accounts.
        vi.mocked(fetchAllPages).mockResolvedValue({
            pages: 2,
            truncated: false,
            items: [
                { id: "a", schema: "s1", service: "postgres", status: { sync_state: "scheduled" } },
                { id: "b", schema: "s2", service: "postgres", status: { sync_state: "syncing" } },
                {
                    id: "c",
                    schema: "s3",
                    service: "mysql",
                    status: { sync_state: "broken", last_sync_error: "auth failed" },
                },
                { id: "d", schema: "s4", service: "stripe", status: { sync_state: "paused" } },
                { id: "e", schema: "s5", service: "stripe", status: { sync_state: "rescheduled" } },
                { id: "f", schema: "s6", service: "stripe", status: { sync_state: "weird_state" } },
                {
                    id: "g",
                    schema: "s7",
                    service: "stripe",
                    status: { sync_state: "scheduled", setup_state: "broken" },
                },
            ],
        });

        const handler = handlers.get("get_account_health_summary")!;
        const response = await handler({});
        const payload = asJSON(response);

        expect(vi.mocked(fetchAllPages)).toHaveBeenCalledWith("/connections");
        expect(payload.total_connectors).toBe(7);
        expect(payload.status_counts).toEqual({
            scheduled: 2,
            syncing: 1,
            broken: 1,
            paused: 1,
            rescheduled: 1,
            other: 1,
        });

        // Both "c" (sync_state broken) and "g" (setup_state broken) should be flagged.
        const ids = payload.critical_issues.map((i: any) => i.id);
        expect(ids).toContain("c");
        expect(ids).toContain("g");
        expect(payload.critical_issues).toHaveLength(2);

        const broken = payload.critical_issues.find((i: any) => i.id === "c");
        expect(broken).toEqual({
            id: "c",
            name: "s3",
            service: "mysql",
            error: "auth failed",
        });
    });
});

describe("get_lineage_report", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(fetchAllPages).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("maps connectors (all pages) to their destinations", async () => {
        vi.mocked(fetchAllPages).mockImplementation(async (endpoint: string) => {
            if (endpoint === "/connections") {
                return {
                    pages: 1, truncated: false,
                    items: [{ id: "c1", schema: "s1", service: "postgres", group_id: "g1" }],
                };
            }
            if (endpoint === "/destinations") {
                return {
                    pages: 1, truncated: false,
                    items: [{ id: "g1", schema: "dwh", service: "snowflake", region: "us-east" }],
                };
            }
            return { items: [], pages: 0, truncated: false };
        });

        const handler = handlers.get("get_lineage_report")!;
        const payload = asJSON(await handler({}));

        expect(vi.mocked(fetchAllPages)).toHaveBeenCalledWith("/connections");
        expect(vi.mocked(fetchAllPages)).toHaveBeenCalledWith("/destinations");
        expect(payload).toHaveLength(1);
        expect(payload[0]).toEqual({
            connector_id: "c1",
            connector_name: "s1",
            source_service: "postgres",
            destination_id: "g1",
            destination_name: "dwh",
            destination_service: "snowflake",
            region: "us-east",
        });
    });
});

describe("analyze_connector_issues", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(fetchAllPages).mockReset();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("returns broken/failed connectors across all pages, newest failure first", async () => {
        vi.mocked(fetchAllPages).mockResolvedValue({
            pages: 1, truncated: false,
            items: [
                { id: "ok", schema: "s", service: "x", status: { sync_state: "scheduled" } },
                {
                    id: "old", schema: "s2", service: "y",
                    status: { sync_state: "broken", last_sync_error: "boom" },
                    failed_at: "2026-01-01T00:00:00Z",
                },
                {
                    id: "new", schema: "s3", service: "z",
                    status: { setup_state: "broken" },
                    failed_at: "2026-06-01T00:00:00Z",
                    setup_tests: [{ status: "FAILED", title: "auth" }, { status: "PASSED", title: "ping" }],
                },
            ],
        });

        const handler = handlers.get("analyze_connector_issues")!;
        const payload = asJSON(await handler({}));

        expect(vi.mocked(fetchAllPages)).toHaveBeenCalledWith("/connections");
        expect(payload.map((i: any) => i.id)).toEqual(["new", "old"]);
        expect(payload[0].failed_tests).toEqual([{ status: "FAILED", title: "auth" }]);
    });
});

describe("export_audit_report", () => {
    let handlers: Map<string, Handler>;

    beforeEach(() => {
        vi.mocked(fetchAllPages).mockReset();
        vi.mocked(fs.writeFileSync).mockClear();
        ({ handlers } = (() => {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any, { allowWrites: true });
            return { handlers };
        })());
    });

    it("paginates every audited resource through fetchAllPages", async () => {
        const byEndpoint: Record<string, any[]> = {
            "/roles": [{ id: "r1" }],
            "/teams": [{ id: "t1" }],
            "/users": [{ id: "u1" }],
            "/connections": [{ id: "c1", schema: "s1", service: "postgres", group_id: "g1", status: {} }],
            "/destinations": [{ id: "g1", schema: "dwh", service: "snowflake", region: "us" }],
        };
        vi.mocked(fetchAllPages).mockImplementation(async (endpoint: string) => ({
            items: byEndpoint[endpoint] ?? [],
            pages: 1,
            truncated: false,
        }));

        const handler = handlers.get("export_audit_report")!;
        await handler({});

        for (const endpoint of Object.keys(byEndpoint)) {
            expect(vi.mocked(fetchAllPages)).toHaveBeenCalledWith(endpoint);
        }
        // roles, teams, users, connections_audit = 4 CSVs written
        expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledTimes(4);
    });
});

describe("write-tool gating via FIVETRAN_ALLOW_WRITES", () => {
    it("does NOT register the gated write tools when allowWrites is false", () => {
        const { server, handlers } = buildServer();
        registerCustomTools(server as any, { allowWrites: false });

        for (const name of WRITE_TOOLS) {
            expect(handlers.has(name)).toBe(false);
        }
        // Sanity: read-only tools are still registered.
        expect(handlers.has("list_connectors")).toBe(true);
        expect(handlers.has("get_account_health_summary")).toBe(true);
    });

    it("does NOT register the gated write tools when no option is passed and env is unset", () => {
        const prev = process.env.FIVETRAN_ALLOW_WRITES;
        delete process.env.FIVETRAN_ALLOW_WRITES;
        try {
            const { server, handlers } = buildServer();
            registerCustomTools(server as any);
            for (const name of WRITE_TOOLS) {
                expect(handlers.has(name)).toBe(false);
            }
        } finally {
            if (prev !== undefined) process.env.FIVETRAN_ALLOW_WRITES = prev;
        }
    });

    it("registers the gated write tools when allowWrites is true", () => {
        const { server, handlers } = buildServer();
        registerCustomTools(server as any, { allowWrites: true });

        for (const name of WRITE_TOOLS) {
            expect(handlers.has(name)).toBe(true);
        }
    });

    it("isWriteEnabled accepts the documented truthy whitelist", () => {
        expect(isWriteEnabled("true")).toBe(true);
        expect(isWriteEnabled("TRUE")).toBe(true);
        expect(isWriteEnabled("1")).toBe(true);
        expect(isWriteEnabled("yes")).toBe(true);
        expect(isWriteEnabled("YES")).toBe(true);
        expect(isWriteEnabled(" true ")).toBe(true);
    });

    it("isWriteEnabled rejects falsy / unrecognized values", () => {
        expect(isWriteEnabled(undefined)).toBe(false);
        expect(isWriteEnabled("")).toBe(false);
        expect(isWriteEnabled("false")).toBe(false);
        expect(isWriteEnabled("0")).toBe(false);
        expect(isWriteEnabled("no")).toBe(false);
        expect(isWriteEnabled("on")).toBe(false);
        expect(isWriteEnabled("enabled")).toBe(false);
    });
});
