# Open Questions

## config-driven-areas - 2026-04-07 (v3 update)

### Resolved in v3

- [x] Nav layout for 11+ areas -- **Decided: "Areas" dropdown.** Committed in v3 per Architect/Critic consensus.
- [x] `searchAllFilings` export -- **Decided: add `export` keyword at efts.ts:67.** One word, zero behavioral change.
- [x] `generateStaticParams` vs `force-dynamic` -- **Decided: `generateStaticParams` + `revalidate = 21600`.** No `force-dynamic` anywhere.
- [x] Redirect mechanism -- **Decided: `next.config.mjs` redirects.** No redirect page files.
- [x] SectionIntro rendering -- **Decided: JSX `<p><strong>` wrapping.** No `dangerouslySetInnerHTML`.
- [x] Home page resilience -- **Decided: `Promise.allSettled`.** Failed counts show "--".

### Still Open

- [ ] Slug format for Topic 832: use `topic-832` (matches ASC naming pattern) or `topic832` (matches old URL)? -- Affects redirect config and URL aesthetics. Plan assumes `topic-832` for consistency.
- [ ] XBRL period parameter: currently hardcoded to `CY2024Q4I` in `xbrl.ts`. Should config allow per-area period override, or keep global? -- Some tags may have sparse data in Q4; quarterly override could improve data quality.
- [ ] Area intro text: who writes the `what`/`why`/`tracks` paragraphs for the 8 new areas? -- Executor can draft from ASC topic descriptions, but domain review may be needed for accuracy.
- [ ] Home page filing count performance: 11 parallel EDGAR API calls on every home page load (cached 6h). Acceptable? -- SEC rate limits are generous but 11 parallel hits from one IP could trigger throttling. Consider staggering or caching counts separately.
- [ ] Custom override escape hatch: should Phase 2 include the override mechanism, or defer until an area actually needs it? -- Plan defers to keep scope minimal, but executor should document the pattern.
