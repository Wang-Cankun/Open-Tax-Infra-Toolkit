# Plan: Config-Driven Area Architecture (v3)

**Date**: 2026-04-07
**Scope**: Refactor 3 hardcoded area pages to config-driven architecture supporting 11 GAAP areas
**Complexity**: MEDIUM (structural refactor, no new dependencies, no data layer changes)

## Context

Current state: 3 area pages (`topic832/page.tsx`, `asc815/page.tsx`, `restatements/page.tsx`) each with hardcoded EFTS queries, intro text, chart rendering, and metric cards. Adding an area requires duplicating ~100 lines of page code and manually wiring nav links.

Target state: single `AreaConfig` type, 11 config objects in one file, one dynamic `[slug]` route that reads config and renders the appropriate layout. Adding area #12 = ~30 lines of config.

## Work Objectives

1. Define `AreaConfig` type system with all per-area data (slug, name, subtitle, description, queries, XBRL tag, intro text, accent color, table/fetch behavior)
2. Create dynamic `src/app/areas/[slug]/page.tsx` generic template with `generateStaticParams` + ISR
3. Redesign home page as area card grid with resilient filing counts (`Promise.allSettled`)
4. Update nav to config-driven "Areas" dropdown
5. Delete old hardcoded pages, add `next.config.mjs` redirects, remove dead code

## Guardrails

**Must Have**
- `src/lib/edgar/efts.ts` unchanged EXCEPT adding `export` keyword to `searchAllFilings` at line 67 (zero behavioral change, only visibility)
- `src/lib/edgar/xbrl.ts` UNCHANGED
- Existing components (`metric-card`, `data-table`, `section-intro`, `nav`) kept and reused
- Light theme, font stack, color system preserved
- `bun run build` passes after every phase
- Pages gracefully handle EDGAR API 500s (already handled in efts.ts/xbrl.ts, but page-level try/catch needed)
- Adding a new area = config object only, zero new page files

**Must NOT Have**
- No new npm dependencies
- No changes to data layer functions (beyond the `export` keyword addition above)
- No dark mode or theme changes
- No `force-dynamic` export on any page (use `generateStaticParams` + `export const revalidate = 21600` instead)
- No `dangerouslySetInnerHTML` anywhere

## Task Flow

```
Phase 1 (foundation)     Phase 2 (generic page)     Phase 3 (home + nav)     Phase 4 (cleanup)
 |                         |                           |                        |
 AreaConfig type    -->    [slug]/page.tsx      -->    home page grid    -->    delete old pages
 areas.ts configs          renders from config         nav dropdown             next.config.mjs redirects
 export searchAllFilings   generateStaticParams        about page update        remove DashboardStats
 getAreaFilings helper     revalidate = 21600          Promise.allSettled       build verify
```

Phases are sequential. Within Phase 1, type + config + helper are parallel.

## Detailed TODOs

### Phase 1: AreaConfig Type System + Config Registry

**Files to create:**
- `src/lib/areas/types.ts` -- AreaConfig interface
- `src/lib/areas/registry.ts` -- all 11 area configs exported as array + lookup map
- `src/lib/areas/data.ts` -- generic data-fetching functions that take an AreaConfig and return page data

**Files to modify:**
- `src/lib/edgar/efts.ts` -- add `export` keyword to `searchAllFilings` (line 67: change `async function searchAllFilings` to `export async function searchAllFilings`). This is one word, zero behavioral change. `searchAllFilings` is already called internally by `searchTopic832` and `searchByAscTopic`; exporting it allows `getAreaFilings` to call it for multi-query areas.

**AreaConfig type shape:**
```
slug: string                         // URL segment: "topic-832", "asc-815", etc.
name: string                         // Display: "Topic 832: Government Grants"
shortName: string                    // Nav label: "Topic 832"
subtitle: string                     // Text under h1: "Tracking adoption of the first..."
description: string                  // Short text for home page area cards (1 sentence)
ascNumber: string                    // "832", "815", etc. (empty string for restatements)
accent: "navy"|"teal"|"amber"|"danger" // 4-color palette, cycling assignment
eftsQueries: string[]                // EFTS search phrases, OR'd then deduped
eftsForms: string[]                  // ["10-K","10-Q"] or ["10-K/A","10-Q/A"]
eftsStartDate?: string               // optional date filter
fetchAll?: boolean                   // default true; false = cap at `limit` (restatements)
limit?: number                       // used when fetchAll=false, default 50
tableMaxRows?: number                // DataTable maxRows prop; default 50, topic832=100
tableSource: "efts" | "xbrl"         // "efts" columns: company/form/filed/period
                                     // "xbrl" columns: company/value/period
xbrl?: {                             // optional -- only 8 of 11 areas have XBRL
  tag: string
  unit: string
  label: string                      // "Derivative Assets", "Goodwill", etc.
}
intro: {
  what: string                       // plain text (no HTML) for SectionIntro
  why: string
  tracks: string
}
```

**Note on accent colors**: 4-color palette (`navy`, `teal`, `amber`, `danger`) cycles across 11 areas. Some areas share a color. This is acceptable for v1; adding more accent values is a future enhancement if needed.

**Data helper (`data.ts`) functions:**

- `getAreaFilings(config)` -- branching logic based on `config.fetchAll`:
  - If `config.fetchAll === false` (restatements): calls `searchFilings(config.eftsQueries[0], { forms: config.eftsForms, startDate: config.eftsStartDate, limit: config.limit ?? 50 })`, returns `result.filings`
  - If `config.fetchAll !== false` (default true): for multi-query areas (topic-832), iterates `config.eftsQueries` calling `searchAllFilings(query, { forms, startDate })` for each, dedupes by accession number. For single-query ASC areas, calls `searchByAscTopic(config.ascNumber, config.eftsStartDate)` directly (already exported at `efts.ts:110-118`).
- `getAreaCount(config)` -- calls `countFilings(config.eftsQueries[0], { forms, startDate })` for the primary query
- `getAreaTimeline(config)` -- computes monthly filing counts from the filing list (same algorithm as `getTopic832Timeline` but computed from `getAreaFilings` output, not a separate fetch). Groups by `fileDate.slice(0,7)`, counts filings + unique CIKs per month.
- `getAreaXbrlFilers(config)` -- if `config.xbrl` exists, calls `getFrames(config.xbrl.tag, { unit: config.xbrl.unit })`. Returns empty array if no xbrl config.

All functions import from `efts.ts` and `xbrl.ts`. The only modification to efts.ts is the `export` keyword.

**11 area configs** (in `registry.ts`):
1. `topic-832` -- Topic 832: Government Grants (eftsQueries: `['"ASU 2025-10"', '"Topic 832"', '"ASC 832"']`, fetchAll: true, tableMaxRows: 100, no XBRL, accent: navy)
2. `asc-815` -- ASC 815: Derivatives & Hedging (eftsQueries: `['"ASC 815"']`, XBRL: DerivativeAssets/USD, tableSource: "xbrl", accent: teal)
3. `asc-820` -- ASC 820: Fair Value (eftsQueries: `['"ASC 820"']`, XBRL: FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue/USD, tableSource: "xbrl", accent: amber)
4. `asc-810` -- ASC 810: Consolidation (eftsQueries: `['"ASC 810"']`, no XBRL, tableSource: "efts", accent: danger)
5. `asc-842` -- ASC 842: Leases (eftsQueries: `['"ASC 842"']`, XBRL: OperatingLeaseLiability/USD, tableSource: "xbrl", accent: navy)
6. `asc-606` -- ASC 606: Revenue (eftsQueries: `['"ASC 606"']`, XBRL: RevenueFromContractWithCustomerExcludingAssessedTax/USD, tableSource: "xbrl", accent: teal)
7. `asc-326` -- ASC 326: Credit Losses (eftsQueries: `['"ASC 326"']`, XBRL: FinancingReceivableAllowanceForCreditLosses/USD, tableSource: "xbrl", accent: amber)
8. `asc-718` -- ASC 718: Stock Comp (eftsQueries: `['"ASC 718"']`, XBRL: ShareBasedCompensation/USD, tableSource: "xbrl", accent: danger)
9. `asc-740` -- ASC 740: Income Taxes (eftsQueries: `['"ASC 740"']`, XBRL: DeferredIncomeTaxLiabilities/USD, tableSource: "xbrl", accent: navy)
10. `asc-350` -- ASC 350: Goodwill (eftsQueries: `['"ASC 350"']`, XBRL: Goodwill/USD, tableSource: "xbrl", accent: teal)
11. `restatements` -- Restatements (eftsQueries: `['"restatement"']`, forms: `["10-K/A","10-Q/A"]`, startDate: "2024-01-01", fetchAll: false, limit: 50, no XBRL, tableSource: "efts", accent: danger)

**Acceptance criteria:**
- [ ] `AreaConfig` type compiles with strict TS, includes all fields: slug, name, shortName, subtitle, description, ascNumber, accent, eftsQueries, eftsForms, eftsStartDate, fetchAll, limit, tableMaxRows, tableSource, xbrl, intro
- [ ] `getAreaBySlug("asc-815")` returns the correct config
- [ ] `getAllAreas()` returns array of 11
- [ ] `getAreaFilings(restatementsConfig)` calls `searchFilings` (not `searchAllFilings`) with limit=50
- [ ] `getAreaFilings(topic832Config)` calls `searchAllFilings` for each of 3 queries, dedupes results
- [ ] `getAreaFilings(asc815Config)` calls `searchByAscTopic("815")` (single-query shortcut)
- [ ] `searchAllFilings` is now exported from `efts.ts` (verify: `export async function searchAllFilings`)
- [ ] `bun run build` passes

---

### Phase 2: Dynamic [slug] Route

**Files to create:**
- `src/app/areas/[slug]/page.tsx` -- generic area page (server component)

**Page structure** (renders based on config presence/absence of fields):
1. **Header**: `<h1>{config.name}</h1>` + `<p className="mt-2 text-ink-muted">{config.subtitle}</p>`
2. **SectionIntro**: renders `config.intro` using existing `SectionIntro` component. Template builds JSX directly from the 3 string fields -- NO `dangerouslySetInnerHTML`. Structure:
   ```jsx
   <SectionIntro>
     <p><strong>What is {config.shortName}?</strong> {config.intro.what}</p>
     <p className="mt-3"><strong>Why does it matter?</strong> {config.intro.why}</p>
     <p className="mt-3"><strong>What this page tracks:</strong> {config.intro.tracks}</p>
   </SectionIntro>
   ```
3. **Metrics row**: filing count + unique companies + (if XBRL) filer count. Uses `MetricCard` with `config.accent`
4. **Timeline chart**: monthly filing bar chart (same CSS bar approach as current topic832 page). Rendered for all areas with `fetchAll: true`. Skipped for `fetchAll: false` areas (restatements).
5. **Top filers chart** (conditional): if `config.xbrl` exists, show top-20 bar chart of XBRL values (same pattern as current asc815 page)
6. **Filing table**: `DataTable` with columns determined by `config.tableSource`:
   - `tableSource: "efts"` -- columns: company / form / filed / period (same as topic832, restatements)
   - `tableSource: "xbrl"` -- columns: company / value (formatted as $XM or $XB) / period (same as asc815)
   - `maxRows` from `config.tableMaxRows ?? 50`

**Key implementation details:**
- `generateStaticParams()` returns all slugs from registry for build-time generation:
  ```ts
  export function generateStaticParams() {
    return getAllAreas().map((a) => ({ slug: a.slug }));
  }
  ```
- `generateMetadata({ params })` reads config for dynamic `<title>`: `{ title: "${config.name} | GAAP Tracker" }`
- `export const revalidate = 21600` (6h ISR). NO `force-dynamic`.
- Wrap data fetches in try/catch: if EDGAR returns 500, show "Data temporarily unavailable" instead of crash
- For XBRL areas, run EFTS and XBRL fetches in parallel via `Promise.all`
- Restatements area: table shows form type (10-K/A, 10-Q/A) prominently since that's the distinguishing feature
- Unknown slug returns 404 via `notFound()`

**Acceptance criteria:**
- [ ] `/areas/topic-832` renders identically to current `/topic832` (same metrics, timeline, table with maxRows=100)
- [ ] `/areas/asc-815` renders identically to current `/asc815` (same metrics, XBRL chart, xbrl table columns)
- [ ] `/areas/restatements` renders identically to current `/restatements` (capped at 50, no timeline)
- [ ] `/areas/asc-820` renders with XBRL data (new page, verify it loads)
- [ ] SectionIntro uses JSX `<p><strong>` wrapping, no `dangerouslySetInnerHTML`
- [ ] Table columns match `tableSource`: efts areas show company/form/filed/period, xbrl areas show company/value/period
- [ ] Unknown slug returns 404 via `notFound()`
- [ ] Page exports `revalidate = 21600` and `generateStaticParams`, does NOT export `dynamic = "force-dynamic"`
- [ ] `bun run build` passes

---

### Phase 3: Home Page Redesign + Nav Update

**Files to modify:**
- `src/app/page.tsx` -- redesign as area card grid with `Promise.allSettled`
- `src/components/nav.tsx` -- config-driven "Areas" dropdown

**Home page redesign:**
- Keep hero section (headline + description) with minor text update to mention "11 areas"
- Replace hardcoded 4 metric cards with: grid of 11 area cards, each showing area `shortName`, `description` (from config), live filing count, accent color stripe
- Area card = link to `/areas/{slug}`, accent left-border (reuse MetricCard pattern or create lightweight `AreaCard`)
- Keep "How it works" section
- Remove old "Explore Topic 832 Adoption" CTA and timeline chart from home page (those live on area pages now)
- **Resilient count fetching**: Use `Promise.allSettled` (NOT `Promise.all`) for the 11 parallel `getAreaCount` calls. For any area whose count fetch rejects or returns an error, display "--" as the count instead of crashing the page.
  ```ts
  const results = await Promise.allSettled(areas.map(a => getAreaCount(a)));
  const counts = results.map(r => r.status === "fulfilled" ? r.value : null);
  // In JSX: count !== null ? count.toLocaleString() : "\u2014"
  ```
- `export const revalidate = 21600`. NO `force-dynamic`.

**New component (optional):**
- `src/components/area-card.tsx` -- small card for home grid (or inline in page.tsx if simple enough)

**Nav update -- "Areas" dropdown (committed decision):**
- Replace hardcoded `LINKS` array with config-driven structure
- Top-level items: `Overview` | `Areas` (dropdown) | `About`
- "Areas" dropdown lists all 11 areas from `getAllAreas()`, each linking to `/areas/{slug}`
- Dropdown is a client component (`"use client"` already present on nav.tsx)
- Dropdown opens on click, closes on click-outside or Escape
- Active-state detection: if current path starts with `/areas/`, highlight "Areas" in nav
- Keep GitHub link on the right

**About page update:**
- `src/app/about/page.tsx` -- generate "Areas covered" section from config registry instead of hardcoded cards

**Acceptance criteria:**
- [ ] Home page shows all 11 areas with filing counts
- [ ] If any area's count fetch fails, that card shows "--" (not a page crash)
- [ ] Home page uses `Promise.allSettled`, not `Promise.all`
- [ ] Each area card links to `/areas/{slug}` and shows `config.description`
- [ ] Nav has "Areas" dropdown listing all 11 areas
- [ ] Dropdown opens on click, closes on click-outside or Escape key
- [ ] Active area page highlights "Areas" in the nav
- [ ] About page lists all 11 areas from config registry
- [ ] Home page does NOT export `force-dynamic`
- [ ] `bun run build` passes

---

### Phase 4: Cleanup + Redirects

**Files to delete:**
- `src/app/topic832/page.tsx`
- `src/app/asc815/page.tsx`
- `src/app/restatements/page.tsx`

**Redirects in `next.config.mjs` (committed decision):**
Add permanent redirects to the existing `next.config.mjs`. No redirect page files.
```js
const nextConfig = {
  experimental: {},
  async redirects() {
    return [
      { source: "/topic832", destination: "/areas/topic-832", permanent: true },
      { source: "/asc815", destination: "/areas/asc-815", permanent: true },
      { source: "/restatements", destination: "/areas/restatements", permanent: true },
    ];
  },
};
```

**Dead code removal:**
- Remove `DashboardStats` type from `src/lib/edgar/types.ts` (lines 24-30). It is dead code -- not imported anywhere. The home page currently uses inline `countFilings` calls, not this type.
- Remove `searchTopic832` and `getTopic832Timeline` from `efts.ts` if no longer imported after Phase 2/3 migration. Verify with a grep before deleting.
- Check for orphaned imports in about page or any other file.

**Acceptance criteria:**
- [ ] `/topic832` redirects to `/areas/topic-832` (301)
- [ ] `/asc815` redirects to `/areas/asc-815` (301)
- [ ] `/restatements` redirects to `/areas/restatements` (301)
- [ ] `DashboardStats` type removed from `types.ts`
- [ ] No orphaned imports or dead code
- [ ] `bun run build` passes with zero errors
- [ ] Total new config per area is ~30 lines (verify with one of the new areas like asc-820)

## Success Criteria

1. All 11 area pages render at `/areas/{slug}` with correct data
2. Home page displays grid of all 11 areas with resilient filing counts (Promise.allSettled)
3. Nav "Areas" dropdown provides access to all areas
4. Old URLs redirect to new paths via `next.config.mjs`
5. Adding area #12 requires only a new config object in `registry.ts` (~30 lines)
6. Build passes, no TypeScript errors, no `force-dynamic` anywhere
7. EDGAR API failures produce graceful fallback UI, not crashes
8. SectionIntro renders plain-text config via JSX, no `dangerouslySetInnerHTML`

## Deferred / Future Enhancements

- **`features: string[]` field on AreaConfig**: Architect suggested synthesizing feature tags from area characteristics. Deferred -- not in Phase 1-4 scope. Can add later for filtering/search on home page.
- **Additional accent colors**: 4-color palette cycles across 11 areas. If the area count grows past ~15, consider expanding to 6-8 colors.
- **Area categories/grouping**: If area count exceeds ~15, consider grouping by topic (measurement, disclosure, recognition) in the dropdown.
- **Home page search/filter**: Filter area cards by keyword or category.

---

## RALPLAN-DR Summary (v3)

### Principles

1. **Config over code** -- area behavior defined by data, not duplicated page files
2. **Preserve working patterns** -- reuse existing components, data layer, and styling; one-word `export` addition is the only data-layer touch
3. **Incremental migration** -- old URLs redirect; no broken links at any phase
4. **Graceful degradation** -- missing XBRL data, API failures, or individual count fetches produce reduced UI, not errors
5. **Minimal surface area** -- no new dependencies, no architecture astronautics

### Decision Drivers (top 3)

1. **Scalability** -- must support 11 areas now, more later, with minimal per-area cost (~30 LOC config)
2. **Build safety** -- `bun run build` must pass after every phase; existing pages must not regress
3. **Maintainability** -- single source of truth for area definitions; no drift between nav, home, and area pages

### Viable Options

**Option A: Dynamic [slug] route with config registry (CHOSEN)**
- Single `src/app/areas/[slug]/page.tsx` reads from `AreaConfig` registry
- Generic data helpers wrap existing EFTS/XBRL functions
- Pros: single page template, config-only area additions, easy to test, natural Next.js pattern
- Cons: all areas share identical layout (mitigated by conditional XBRL section + tableSource column strategy); custom overrides require escape hatch

**Option B: Code-generation approach**
- Script generates per-area page files from config at build time
- Each area gets its own `src/app/areas/{slug}/page.tsx` file
- Pros: full per-area customization, familiar static file structure, no runtime config lookup
- Cons: generated files = merge conflict risk, harder to maintain, code duplication (11 near-identical files), violates "30 lines to add area" constraint

**Option C: Middleware-based routing with single page**
- Single `/areas/page.tsx` with middleware extracting slug from URL
- Pros: even simpler file structure
- Cons: fights Next.js App Router conventions, loses `generateStaticParams`/`generateMetadata`, harder to reason about

### Chosen Option

**Option A** -- it is the idiomatic Next.js 14 App Router pattern for config-driven dynamic routes. `generateStaticParams` gives build-time validation of all slugs. Conditional rendering (XBRL section shown/hidden, table columns driven by `tableSource`) handles layout variation between areas. If a specific area needs truly custom rendering in the future, a custom override file at `src/app/areas/{slug}/page.tsx` (explicit file beats dynamic route in Next.js) provides an escape hatch without changing the architecture.

### Invalidation Rationale

- **Option B rejected**: code generation adds build complexity and defeats the "zero new files per area" goal. Generated files create maintenance burden and merge conflicts.
- **Option C rejected**: fighting the App Router's file-based routing loses `generateStaticParams`, `generateMetadata`, and per-route ISR control. Middleware adds latency and complexity for no benefit.

### ADR

- **Decision**: Config-driven `[slug]` dynamic route with AreaConfig registry
- **Drivers**: scalability (11+ areas), build safety, single source of truth
- **Alternatives**: code-gen per-area files, middleware routing
- **Why chosen**: idiomatic Next.js 14, zero new files per area, preserves static analysis + ISR, `generateStaticParams` validates all slugs at build time
- **Consequences**: all areas share one layout template with conditional sections (XBRL chart, table column strategy); truly custom pages require explicit file override
- **Follow-ups**: consider `features: string[]` config field for filtering; expand accent palette if area count exceeds ~15; add area grouping/categories if needed

### Changes from v2 (iteration 2 feedback)

1. Resolved `searchAllFilings` export -- guardrail amended to allow `export` at efts.ts:67
2. Resolved `generateStaticParams` vs `force-dynamic` -- dropped `force-dynamic` everywhere, committed to `generateStaticParams` + `revalidate = 21600`
3. Added missing AreaConfig fields: `subtitle`, `description`, `tableMaxRows`, `fetchAll`, `limit`, `tableSource`
4. Home page uses `Promise.allSettled` not `Promise.all`; failed counts show "--"
5. Restatements fetch behavior: `getAreaFilings` branches on `config.fetchAll`
6. SectionIntro rendering: JSX `<p><strong>` wrapping, no `dangerouslySetInnerHTML`
7. Committed to `next.config.mjs` redirects (removed alternative option)
8. Committed to "Areas" dropdown in nav (removed open question)
9. Noted `searchByAscTopic` (efts.ts:110-118) as existing export for single-query ASC areas
10. Noted `DashboardStats` as dead code to remove in Phase 4
11. Deferred `features: string[]` as future enhancement
12. Documented 4-color accent palette cycling as minor limitation
