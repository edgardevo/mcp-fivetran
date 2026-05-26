#!/usr/bin/env node

/**
 * Bumps the project version in every place it is hardcoded, keeping them in sync:
 *   - package.json            (npm package version)
 *   - gemini-extension.json   (version reported by Gemini CLI)
 *   - src/index.ts            (version reported to MCP clients in the handshake)
 *
 * Usage:
 *   node scripts/bump-version.mjs [patch|minor|major|x.y.z]
 *
 * Defaults to "patch". Prints "<old> -> <new>" on success.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const bump = process.argv[2] || "patch";

const pkgPath = path.join(root, "package.json");
const extPath = path.join(root, "gemini-extension.json");
const indexPath = path.join(root, "src", "index.ts");

function computeNext(version, kind) {
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind; // explicit version
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Current version is not semver: ${version}`);
  const [maj, min, pat] = match.slice(1).map(Number);
  switch (kind) {
    case "major": return `${maj + 1}.0.0`;
    case "minor": return `${maj}.${min + 1}.0`;
    case "patch": return `${maj}.${min}.${pat + 1}`;
    default:
      throw new Error(`Unknown bump type "${kind}". Use major | minor | patch | x.y.z`);
  }
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current = pkg.version;
const next = computeNext(current, bump);

// package.json — 4-space indent + trailing newline to match the pretty-format-json hook.
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n");

// gemini-extension.json
const ext = JSON.parse(readFileSync(extPath, "utf8"));
ext.version = next;
writeFileSync(extPath, JSON.stringify(ext, null, 4) + "\n");

// src/index.ts
const indexSrc = readFileSync(indexPath, "utf8");
const replaced = indexSrc.replace(/version:\s*"\d+\.\d+\.\d+"/, `version: "${next}"`);
if (replaced === indexSrc) {
  throw new Error('Could not find a `version: "x.y.z"` string in src/index.ts');
}
writeFileSync(indexPath, replaced);

console.log(`${current} -> ${next}`);
