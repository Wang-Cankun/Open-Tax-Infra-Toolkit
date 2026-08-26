# Autopilot Plan: Next.js GAAP Tracker Dashboard

## Architecture

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Tremor for dashboard chart components (built for this exact use case)
- Server components fetch SEC EDGAR APIs directly (no Python needed)
- ISR caching (revalidate every 6 hours)
- Deploy to Vercel (free)

## Structure

```
gaap-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx            (root layout, nav, dark theme)
│   │   ├── page.tsx              (overview dashboard)
│   │   ├── topic832/page.tsx     (government grants tracker)
│   │   ├── asc815/page.tsx       (derivatives analysis)
│   │   ├── restatements/page.tsx (restatement patterns)
│   │   └── about/page.tsx
│   ├── lib/
│   │   ├── edgar/efts.ts         (EFTS search wrapper)
│   │   ├── edgar/xbrl.ts         (XBRL Frames wrapper)
│   │   └── edgar/types.ts        (shared types)
│   └── components/
│       ├── nav.tsx               (sidebar navigation)
│       ├── metric-card.tsx       (stat display)
│       └── charts/               (chart wrappers)
├── analysis/                     (Python notebooks, kept)
├── data/                         (Python data layer, kept for notebooks)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md                     (updated)
```

## Execution Order

Wave 1 (parallel, no deps):
- Init Next.js project (package.json, tsconfig, tailwind, next.config)
- lib/edgar/types.ts
- lib/edgar/efts.ts
- lib/edgar/xbrl.ts

Wave 2 (parallel, depends on Wave 1):
- components/nav.tsx
- components/metric-card.tsx
- app/layout.tsx

Wave 3 (parallel, depends on Wave 2):
- app/page.tsx (overview)
- app/topic832/page.tsx
- app/asc815/page.tsx
- app/restatements/page.tsx
- app/about/page.tsx

Wave 4: Test, verify, README update
