/**
 * Generates `DOCS.md` from the live tool registry.
 *
 * Strategy: build a fake "collector" object exposing the same `tool()`
 * signature as `McpServer`, then call each registration function. This
 * avoids spinning up a real MCP server / stdio transport.
 *
 * Run with: `npm run docs` (which invokes tsx on this file).
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z, type ZodTypeAny } from "zod";

import { registerGeneratedTools } from "../src/generated_tools.js";
import { registerCustomTools } from "../src/custom_tools.js";
import { registerCensusTools } from "../src/census_tools.js";

type ParamSchema = Record<string, ZodTypeAny>;

interface CollectedTool {
    name: string;
    description: string;
    params: ParamSchema;
}

interface ToolGroup {
    title: string;
    blurb: string;
    tools: CollectedTool[];
}

// Minimal subset of the McpServer surface that the registration
// functions actually call.
function makeCollector(sink: CollectedTool[]) {
    return {
        tool(name: string, description: string, params: ParamSchema, _handler: unknown) {
            sink.push({ name, description, params: params ?? {} });
        },
    };
}

/**
 * Best-effort, dependency-free render of a Zod schema into a short
 * human-readable type label. Full Zod JSON-Schema rendering would
 * pull in extra deps; we just want enough context for a docs reader
 * (type, optional, default, enum values).
 */
function renderZodType(schema: ZodTypeAny): string {
    // Unwrap optionals / defaults to inspect the inner type.
    let current: ZodTypeAny = schema;
    let optional = false;
    let defaultValue: unknown = undefined;
    let hasDefault = false;

    // Walk wrappers up to a small depth to avoid runaway loops.
    for (let i = 0; i < 8; i++) {
        const def = (current as { _def?: { typeName?: string; innerType?: ZodTypeAny; defaultValue?: () => unknown } })._def;
        if (!def) break;
        if (def.typeName === "ZodOptional" && def.innerType) {
            optional = true;
            current = def.innerType;
            continue;
        }
        if (def.typeName === "ZodDefault" && def.innerType) {
            hasDefault = true;
            try {
                defaultValue = def.defaultValue?.();
            } catch {
                defaultValue = "<unknown>";
            }
            current = def.innerType;
            continue;
        }
        if (def.typeName === "ZodNullable" && def.innerType) {
            current = def.innerType;
            continue;
        }
        break;
    }

    const innerDef = (current as { _def?: { typeName?: string; values?: unknown[]; type?: ZodTypeAny } })._def;
    const typeName = innerDef?.typeName ?? "Zod";
    let label: string;
    switch (typeName) {
        case "ZodString":
            label = "string";
            break;
        case "ZodNumber":
            label = "number";
            break;
        case "ZodBoolean":
            label = "boolean";
            break;
        case "ZodAny":
            label = "any";
            break;
        case "ZodArray": {
            const elem = innerDef?.type ? renderZodType(innerDef.type) : "any";
            label = `array<${elem}>`;
            break;
        }
        case "ZodEnum": {
            const values = (innerDef?.values ?? []) as string[];
            label = `enum(${values.map((v) => JSON.stringify(v)).join(" | ")})`;
            break;
        }
        case "ZodObject":
            label = "object";
            break;
        default:
            // Strip the leading "Zod" prefix as a fallback.
            label = typeName.replace(/^Zod/, "").toLowerCase() || "unknown";
    }

    const bits: string[] = [label];
    if (optional) bits.push("optional");
    if (hasDefault) bits.push(`default=${JSON.stringify(defaultValue)}`);
    return bits.join(", ");
}

function getDescription(schema: ZodTypeAny): string {
    const desc = (schema as { description?: string }).description;
    return desc ?? "";
}

function renderToolsMarkdown(group: ToolGroup): string {
    const lines: string[] = [];
    lines.push(`## ${group.title}`);
    lines.push("");
    lines.push(group.blurb);
    lines.push("");
    lines.push(`_${group.tools.length} tool${group.tools.length === 1 ? "" : "s"}._`);
    lines.push("");

    for (const tool of group.tools) {
        lines.push(`### \`${tool.name}\``);
        lines.push("");
        lines.push(tool.description || "_(no description)_");
        lines.push("");
        const keys = Object.keys(tool.params);
        if (keys.length === 0) {
            lines.push("**Parameters:** _none_");
            lines.push("");
            continue;
        }
        lines.push("**Parameters:**");
        lines.push("");
        lines.push("| Name | Type | Description |");
        lines.push("| --- | --- | --- |");
        for (const key of keys) {
            const schema = tool.params[key];
            const typeLabel = renderZodType(schema).replace(/\|/g, "\\|");
            const desc = (getDescription(schema) || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
            lines.push(`| \`${key}\` | ${typeLabel} | ${desc} |`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

async function main() {
    const generated: CollectedTool[] = [];
    const custom: CollectedTool[] = [];
    const census: CollectedTool[] = [];

    registerGeneratedTools(makeCollector(generated) as unknown as Parameters<typeof registerGeneratedTools>[0]);
    // Catalogue all tools regardless of FIVETRAN_ALLOW_WRITES env state.
    registerCustomTools(
        makeCollector(custom) as unknown as Parameters<typeof registerCustomTools>[0],
        { allowWrites: true },
    );
    registerCensusTools(makeCollector(census) as unknown as Parameters<typeof registerCensusTools>[0]);

    const groups: ToolGroup[] = [
        {
            title: "Custom audit & operations",
            blurb: "Hand-written audit, lineage, export, and operational tools. Source: `src/custom_tools.ts`.",
            tools: custom,
        },
        {
            title: "Fivetran REST API (generated)",
            blurb: "Read-only Fivetran tools derived from `openapi.json`. Source: `src/generated_tools.ts`.",
            tools: generated,
        },
        {
            title: "Census Activations",
            blurb: "Tools that wrap the Census (Activations) reverse-ELT API. Source: `src/census_tools.ts`.",
            tools: census,
        },
    ];

    const total = groups.reduce((acc, g) => acc + g.tools.length, 0);

    const __filename = fileURLToPath(import.meta.url);
    const repoRoot = resolve(dirname(__filename), "..");
    const outPath = resolve(repoRoot, "DOCS.md");

    const header: string[] = [];
    header.push("# Tool catalogue");
    header.push("");
    header.push(
        "Auto-generated from the live tool registry. Do not edit by hand — run `npm run docs` to regenerate.",
    );
    header.push("");
    header.push(`**Total tools:** ${total}`);
    header.push("");
    header.push("**Sections:**");
    for (const g of groups) {
        const anchor = g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        header.push(`- [${g.title}](#${anchor}) — ${g.tools.length} tools`);
    }
    header.push("");

    const body = groups.map(renderToolsMarkdown).join("\n");
    const output = `${header.join("\n")}\n${body}`;

    writeFileSync(outPath, output, "utf8");
    console.log(`Wrote ${outPath} (${total} tools: custom=${custom.length}, generated=${generated.length}, census=${census.length})`);
}

main().catch((err) => {
    console.error("generate-docs failed:", err);
    process.exit(1);
});
