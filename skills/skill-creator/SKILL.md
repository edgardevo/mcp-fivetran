---
name: skill-creator
description: "Guidelines for creating new Fivetran-specific skills. Use this skill when the user wants to add a new workflow or capability to the extension. It ensures consistent naming, metadata, and workflow structure."
---

# Fivetran Skill Creator

## Overview
This skill provides a standardized blueprint for expanding the Fivetran Gemini CLI extension. It ensures every new skill follows the "Atlassian Pattern" of structured, multi-step workflows.

## Workflow Blueprints

### 1. Structure
Every skill must be placed in a directory: `skills/[skill-name]/SKILL.md`.

### 2. Frontmatter
The `SKILL.md` must start with YAML frontmatter:
```yaml
---
name: [kebab-case-name]
description: "[One sentence summary]"
---
```

### 3. Workflow Steps
Define clear, sequential steps (Step 1, Step 2, etc.). Each step should:
- State its purpose.
- List relevant tools (e.g., `list_all_connections()`).
- Define the logic for handling tool outputs.

### 4. Integration
Once a skill is created:
1. Run `npm run validate` to check the frontmatter.
2. Ensure the `gemini-extension.json` includes the `skills` path.

## Examples
- **Audit Skill:** Scan → Identify Risks → Report.
- **Triage Skill:** Inspect Error → Match Pattern → Remediate.
- **Explorer Skill:** Search → Trace → Visualize.
