#!/usr/bin/env node

/**
 * Fivetran MCP Server Validation Script
 *
 * Validates that skills, rules, and references follow the project structure
 * and include required frontmatter/metadata.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const errors = [];

function addError(message) {
  errors.push(message);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return null;
  }

  const closingIndex = content.indexOf("\n---\n", 4);
  if (closingIndex === -1) {
    return null;
  }

  const frontmatterBlock = content.slice(4, closingIndex);
  const fields = {};

  for (const line of frontmatterBlock.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields[key] = value;
  }

  return fields;
}

async function validateSkills() {
  const skillsDir = path.join(repoRoot, "skills");
  if (!(await pathExists(skillsDir))) return;

  const skillFolders = await fs.readdir(skillsDir);
  for (const folder of skillFolders) {
    const skillPath = path.join(skillsDir, folder, "SKILL.md");
    if (!(await pathExists(skillPath))) {
      addError(`Skill folder "${folder}" missing SKILL.md`);
      continue;
    }

    const content = await fs.readFile(skillPath, "utf8");
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      addError(`Skill "${folder}" missing YAML frontmatter in SKILL.md`);
      continue;
    }

    if (!parsed.name || !parsed.description) {
      addError(`Skill "${folder}" frontmatter missing "name" or "description"`);
    }
  }
}

async function validateRules() {
  const rulesDir = path.join(repoRoot, "rules");
  if (!(await pathExists(rulesDir))) return;

  const ruleFiles = await fs.readdir(rulesDir);
  for (const file of ruleFiles) {
    if (file.endsWith(".md")) {
      const content = await fs.readFile(path.join(rulesDir, file), "utf8");
      if (!content.includes("# ")) {
        addError(`Rule file "${file}" missing a H1 title`);
      }
    }
  }
}

async function main() {
  console.log("Starting validation...");
  await validateSkills();
  await validateRules();

  if (errors.length > 0) {
    console.error("Validation FAILED:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Validation PASSED.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
