# SEO change log

Running log of deliberate SEO / content changes, why they were made, and how to measure impact. Each entry includes baseline metrics so future analysis has a "before" to compare against.

---

## 2026-04-19 — Title, description & H2 rewrites on 4 pages

### Why this was done

GA4 + Search Console analysis (see `scripts/ga-report.mjs`) surfaced a pattern: several content pages ranked well in Google but had extremely low click-through rates, indicating snippet/title problems rather than ranking problems.

### Baseline metrics (28 days ending 2026-04-19)

Site-wide:
- 892 active users, 1,049 sessions, 1,155 page views (~1.1 pages/session)
- Bounce 70.8%, engagement 29.2%
- Google organic: 523 sessions (50% of traffic)
- Homepage bounce rate as a landing page: **95%** (161 sessions, 1.07 pages/session, 31s avg) — identified as the biggest structural issue, NOT addressed in this change

Per-page Search Console (90-day window):

| Page | Impressions | Clicks | CTR | Avg pos |
|---|---|---|---|---|
| `/architect-plans/` | 18,595 | 50 | 0.3% | 2.6 |
| `/brick-cladding-hebel-or-otherwise/` | 8,810 | 55 | 0.6% | 7.8 |
| `/checking-your-plans/` | 4,065 | 34 | 0.8% | 3.1 |
| `/windows/` | 1,614 | 3 | 0.2% | 38.2 |

Key missed queries (all ranked well, almost no clicks):
- `architectural plan` — 6,383 impr, pos 1.6, 0.4% CTR
- `architecture plan` — 3,517 impr, pos 1.5, 0.6% CTR
- `architectural plans` — 8,555 impr, pos 3.5, 0.2% CTR
- `hebel vs brick` — 985 impr, pos 8.7, 0.5% CTR
- `aluminium windows price` — 47 impr, pos 50 (off page 5)

### What changed

**Frontmatter title + description** on:
- `src/content/pages/architect-plans.md`
- `src/content/pages/brick-cladding-hebel-or-otherwise.md`
- `src/content/pages/checking-your-plans.md`
- `src/content/pages/windows.md`

Changes lead with the dominant search query in the title, mention Australia for geographic intent, and promise concrete value ("Stages, Costs & Copyright Traps", "Cost, Thermal & Maintenance Compared", "A Builder's Checklist Before You Sign").

**Seven H2 renames** on `src/content/pages/windows.md`:
- "Material" → "Window Frame Materials: Aluminium vs uPVC vs Timber"
- "Aesthetics (Commercial Windows) + Sizing" → "Window Sizing & Commercial vs Residential Frames"
- "Types of Windows" → "Window Types: Awning vs Sliding vs Casement vs Tilt-and-Turn"
- "Glazing Options" → "Single vs Double Glazing: What's Worth the Cost"
- "Thermal Efficiency & How to Compare Windows for this" → "U-Values, SHGC & AI: How to Compare Windows for Thermal Efficiency"
- "Glazing" (duplicate of the one above) → "Glass Types: Low-E, Laminated, Acoustic & Viridian Options"
- "Snapshot of pricing as of Jan 22" → "Window Prices in Australia (2022 Snapshot — Wideline & Roseberry)"

Rationale: section headings were too generic for Google to extract as featured snippets or match against buyer intent queries (`aluminium windows price`, `casement vs awning`, `U-value meaning`).

### How to measure impact

Re-run these in 2–4 weeks and compare against the baseline above:

```bash
npm run ga:report -- --report=queries       # overall queries + landing pages
npm run ga:report -- --report=pages          # top pages by views
npm run ga:report -- --report=all            # everything
```

Success criteria (conservative):
- `/architect-plans/` CTR moves from 0.3% → at least 1.5% at a similar position
- `/brick-cladding-hebel-or-otherwise/` CTR moves from 0.6% → at least 2%
- `/windows/` starts picking up impressions for pricing-intent queries
- Overall Google organic sessions grow (currently 523/28d)

Google typically re-crawls within days to weeks. If titles don't update in SERPs after 4 weeks, something else is going on.

### Outstanding SEO recommendations (not yet done)

High leverage, in order:

1. **Homepage funnel** — `/` landing sessions have a 95% bounce rate and 1.07 pages/session. Page content doesn't guide visitors to any of the high-engagement content pages (`/architect-plans/`, `/brick-cladding-hebel-or-otherwise/`, `/construction-phases/`). Consider a "Start here" sequence or prominent feature blocks.
2. **Refresh `/windows/` pricing section** with current 2026 market ranges. Pricing tables are dated "Jan 22" (4+ years stale). Competitors rank with 2026-dated pages.
3. **Split `/windows/` pricing into its own URL** — e.g. `/windows/prices/` — to target commercial intent (`aluminium windows price`) while keeping the long-form guide intact. Top SERP results for pricing queries are dedicated pricing pages, not long guides.
4. **Add FAQ schema markup** to top-ranked content pages. Queries like `hebel vs brick` and `double glazing cost` are well-suited to rich snippets.
5. **Investigate bot/junk traffic** — 34% of sessions are "direct" with 9.8% engagement. 83 sessions/28d have `(not set)` landing page at 100% bounce. Likely bots. Consider Cloudflare bot filter + GA exclusion.
6. **`/architect-plan/` (singular) redirect** — currently a separate "Replaced" page. Confirm it 301s to `/architect-plans/`.
7. **Spin out pages for underserved queries:**
   - `/windows/double-glazing-cost/` — query getting impressions at pos 96
   - `/windows/bifold-windows-cost/` — pos 88

### Files touched
- `src/content/pages/architect-plans.md` (frontmatter)
- `src/content/pages/brick-cladding-hebel-or-otherwise.md` (frontmatter)
- `src/content/pages/checking-your-plans.md` (frontmatter)
- `src/content/pages/windows.md` (frontmatter + 7 H2s)
