# DHA Phase 9 Prism — Governed Market Intelligence

## Release state
Phase 9 Prism is published as a governed engineering and market-intelligence prototype.

- Engineering plots: **19,285**
- Sectors: **16**
- Market-bearing plots: **1,068**
- Accepted historical dealer ASK claims: **5,690**
- Held events excluded: **8,305**
- Tier-1 geometry mutations from market publication: **0**

## Runtime
The GOD'S EYE market panel loads `/phase9/market.json`. It supports plot-ID search across the full Phase 9 market-bearing population and shows latest, median, minimum and maximum historical dealer asks plus evidence history.

Historical dealer asks are **not completed transactions, valuations, or proof of current availability**. A plot with no observation is **unknown**, not zero-priced, sold, or off-market.

## Architecture
Canonical spatial truth remains PostGIS on the GOD'S EYE database boundary. QGIS is the engineering/QA workspace. GOD'S EYE is the operational UI.

Governed PostGIS publication:
- `godseye.phase9_prism_market_history`
- `godseye.phase9_prism_market_summary`
- `godseye.phase9_prism_market_bearing`
- `godseye.phase9_prism_sector_coverage`

The one-geometry-per-plot operational publication is kept separate from historical evidence rows.

## Data and UI
- UI module: `src/phase9Market.js`
- Full snapshot: `public/phase9/market.json`
- Tests: `src/phase9Market.test.mjs`
- Production QGIS: `production/GODS_EYE_PHASE9_FULL_MARKET_REVIEW.qgz`
- Governed QGIS release: `production/GODS_EYE_PHASE9_GOVERNED_RELEASE_V1.qgz`

## Validation
Run:
```
npm test
npm run build
```
The release checkpoint also records QGIS reopen, governed export, database publication and runtime smoke-test evidence.

## Certification boundary
The 19,285-plot geometry is the completed engineering baseline. It is **not represented as final authoritative cadastral certification**. That certification remains gated on authoritative road-axis/survey corroboration.

## Replication
Phase 9 is the locked prototype for the subsequent DHA programme:
Phase 6 → Phase 7 → Phase 8 → Phase 10 → Phases 1–5 → remaining DHA Lahore → other DHA cities across Pakistan.

Mandatory pipeline:
SOURCE → STAGING → RECONCILIATION → ENGINEERING IDENTITY → IDENTITY CROSSWALK → MARKET EVIDENCE → QA/HOLDS → POSTGIS PUBLICATION → QGIS → GOD'S EYE → CHECKPOINT/RELEASE.
