# dgc-fivetran — Improvement & Gap-Closure Plan

A single, ordered backlog derived from a full code review and a coverage audit
against the Fivetran REST API (`openapi.json`: 161 operations — 63 GET, 46 POST,
24 PATCH, 28 DELETE).

**Current state:** 100% of read (GET) endpoints implemented; 3 of 98 write
operations; ~41% of the total API surface. Read coverage is complete by design —
the gaps are correctness bugs and the write side.

**How to use this file:** work top to bottom. Section 1 (bugs) ships first
because correctness beats features. Section 2 (features) is ordered by value.
Each item is intentionally high-level — expand it into a detailed sub-plan when
you pick it up. Check the box when done and link the PR/commit.

Legend: 🐞 bug · 🧹 code quality · ✨ feature · 📦 distribution · 📝 docs

---

## Section 1 — Bugs & correctness (do these first)

Ordered by impact: silent wrong data > misleading behavior > robustness.

- [x] **1.1 🐞 Aggregate tools silently undercount on accounts with >100 connectors.**
  `get_account_health_summary`, `get_lineage_report`, `analyze_connector_issues`
  (`src/custom_tools.ts`) and `export_audit_report` each fetch a single
  `/connections` page (default size 100) with no cursor follow, so large accounts
  get partial, wrong reports despite "comprehensive"/"every connector" wording.
  → Build a shared `fetchAllPages(endpoint, params)` helper (see 2.1) and route
  all aggregate tools through it. **Highest priority — an audit tool that drops
  data is worse than one that errors.**

- [x] **1.2 🐞 Tool errors are not flagged as errors.** Only `test_connection`
  sets `isError: true`. Every generated tool, every Census tool, and the aggregate
  tools return `response.error` as ordinary text in a success envelope, so the MCP
  host/model can't tell "here's your data" from "the API 404'd."
  → Wrap the error path so any response carrying `.error` returns
  `{ content: [...], isError: true }`. Centralize the response formatting.

- [x] **1.3 🐞 `find_connector_by_table` — misleading comment + silent truncation.**
  Comment claims "first 10 active connectors" but the code iterates *all*
  connectors (one sequential schema call each — slow, rate-limit-prone) and stops
  only after 5 *results*, silently missing matches.
  → Fix the comment to match behavior, surface "stopped early / N scanned" in the
  output, and consider bounding the connector scan explicitly.

- [x] **1.4 🐞 `export_fivetran_data` first-page logic is convoluted and slightly
  buggy.** When the response has no `items` array it pushes the whole response
  wrapper as a single "row"; the `limit` param is documented as a page-count cap
  but per-request size is hardcoded to 100.
  → Simplify using the 2.1 pagination helper; clarify/rename the cap param.

- [x] **1.5 🐞 No request timeout anywhere.** `makeApiRequest` (`src/common.ts`)
  calls `fetch` with no `AbortController`/timeout, so a hung Fivetran/Census
  connection blocks the tool — and the stdio server — indefinitely.
  → Add `AbortSignal.timeout(~30s)`; surface a clean timeout error.

- [x] **1.6 🐞 Broken `npm run generate` script.** `package.json` references
  `python3 scripts/generate_mcp_tools_ts.py`, which does not exist in the repo.
  → Either commit the generator or remove the script. Decide the source of truth
  for `generated_tools.ts` (regenerate-from-`openapi.json` vs. hand-maintained).

---

## Section 2 — Code-quality cleanups (quick, low-risk; fold into Section 1 PRs)

- [x] **2.1 🧹 Shared auto-paginating list helper.** `fetchAllPages(endpoint,
  params)` that follows `next_cursor`. Unblocks 1.1 and 1.4 and removes duplicated
  cursor logic. (Foundational — likely the first thing to build.)

- [x] **2.2 🧹 Redaction: drop bare `"key"` exact match** (`src/common.ts`). It
  redacts any field literally named `key` regardless of context; the `_key` suffix
  already covers `private_key`, `encryption_key`, etc.

- [x] **2.3 🧹 Remove dead defensive code.** The
  `typeof response === 'string' ? response : JSON.stringify(...)` guard appears
  ~8× but `makeRequest` never returns a string. Collapse into the shared formatter
  from 1.2.

- [x] **2.4 🧹 Parallelize independent calls in `export_audit_report`.** Roles /
  teams / users / connections / destinations are independent — use `Promise.all`.

- [x] **2.5 🧹 Test coverage gaps.** No direct tests for `generated_tools.ts` or
  `census_tools.ts`; the trickiest logic (`export_fivetran_data` pagination,
  `find_connector_by_table`) is untested. Add tests as each is touched. Consider a
  soft coverage floor in CI once stabilized.

---

## Section 3 — Feature gaps (write operations), ordered by value

All write tools MUST be gated behind `FIVETRAN_ALLOW_WRITES`, following the
existing `create_connector` pattern (test-first). 95 write ops are unimplemented;
these are grouped by value, not by count.

### 3a — High value: close the audit → remediation loop (do first)

The server's skills (sync-triage, health-report) imply remediation the tools
can't currently perform.

- [x] **3.1 ✨ `update_connector`** — `PATCH /connections/{id}`. Pause/unpause,
  change sync frequency, reschedule. *The most common "I found a problem, fix it"
  action; currently impossible.*

- [x] **3.2 ✨ `run_connection_tests`** — `POST /connections/{id}/test`.
  `analyze_connector_issues` reads failed setup tests but can't re-run them.

- [x] **3.3 ✨ Schema-config writes — the single biggest functional gap.**
  Enable/disable tables & columns. Read counterparts already exist.
  - `PATCH /connections/{id}/schemas` (whole config)
  - `PATCH /connections/{id}/schemas/{schema}`
  - `PATCH /connections/{id}/schemas/{schema}/tables/{table}`
  - `PATCH /connections/{id}/schemas/{schema}/tables/{table}/columns/{column}`

- [ ] **3.4 ✨ Schema lifecycle helpers** — `POST /schemas/reload`,
  `POST /schemas/drop-columns`, `POST /schemas/tables/resync` (targeted resync),
  `DELETE .../columns/{column}` (drop blocked column).

- [ ] **3.5 ✨ `delete_connector`** — `DELETE /connections/{id}`. Destructive;
  gate carefully (consider an extra confirmation arg).

### 3b — Medium value: provisioning & destinations

- [ ] **3.6 ✨ Destinations CRUD + test** — `POST/PATCH/DELETE /destinations`,
  `POST /destinations/{id}/test` (8 ops).

- [ ] **3.7 ✨ Groups CRUD + user membership** — `POST/PATCH/DELETE /groups`,
  add/remove group users (5 ops).

- [ ] **3.8 ✨ `create_connect_card`** — `POST /connections/{id}/connect-card`
  (self-serve onboarding flow; pairs with the onboarding skill).

### 3c — Governance & security (relevant to the security-audit skill)

- [ ] **3.9 ✨ Users management** — full `users` write set (10 ops).
- [ ] **3.10 ✨ Teams / RBAC** — full `teams` write set (13 ops).
- [ ] **3.11 ✨ Certificate & fingerprint approve/revoke** on connections &
  destinations (8 ops).
- [ ] **3.12 ✨ Security/networking surfaces** — `webhooks` (5),
  `external-logging` (7), `private-links` (3), `proxy` (3), `system-keys` (4).

### 3d — Advanced / niche (lowest priority)

- [ ] **3.13 ✨ Transformations / dbt** — `transformations` (6) +
  `transformation-projects` (4).
- [ ] **3.14 ✨ `connector-sdk` (3), `hybrid-deployment-agents` (4), `hvr` (1),
  `certificates` (1).**

---

## Section 4 — Platform, distribution & docs

- [ ] **4.1 📦 Packaging for `npx` / npm.** No `bin` field or shebang today, so
  install is git-clone + build only. Add a `bin` entry + shebang; consider
  publishing to npm to lower adoption friction.

- [ ] **4.2 ✨ Census (Activations) write tools.** Read-only today; the Census API
  supports `trigger_sync` and more. Add gated write tools to mirror the Fivetran
  side. Also: Census tools have no pagination helper.

- [ ] **4.3 ✨ Expose MCP prompts/resources.** Only tools are exposed. The rich
  `skills/` and `commands/` are Gemini-extension-specific; surfacing a few as MCP
  prompts would help other MCP clients.

- [ ] **4.4 ✨ Separate API surfaces not in `openapi.json`.** Fivetran **Metadata
  API** and **Log Service** live outside the core spec. If connector/sync *log
  retrieval* matters for triage, scope it as its own addition (won't appear as a
  gap against `openapi.json`).

- [ ] **4.5 ✨ Optional HTTP/SSE transport.** Only stdio today; an HTTP transport
  would broaden where the server can run.

- [ ] **4.6 📝 README accuracy.**
  - Fix the auto-pagination claim (only `export_fivetran_data` follows cursors
    today; see 1.1/2.1).
  - Add a one-liner: 100% of read endpoints covered; destructive writes (DELETE,
    RBAC, schema mutation) intentionally omitted / gated.

---

## Suggested first milestone

Bundle the foundational, low-risk fixes into one branch, test-first:
**2.1 (pagination helper) → 1.1 (aggregate undercount) → 1.2 (isError) →
1.5 (timeout)**, then **3.1 + 3.2** to land the first remediation tools.
