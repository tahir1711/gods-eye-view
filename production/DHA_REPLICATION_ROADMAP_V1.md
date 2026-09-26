# GOD'S EYE DHA REPLICATION ROADMAP

## Locked prototype
DHA Lahore Phase 9 Prism is the replication baseline.

## Execution order
1. DHA Lahore Phase 6
2. DHA Lahore Phase 7
3. DHA Lahore Phase 8
4. DHA Lahore Phase 10
5. DHA Lahore Phases 1, 2, 3, 4, 5
6. Remaining DHA Lahore schemes/phases
7. DHA schemes in other cities across Pakistan

## Mandatory replication pipeline
SOURCE -> STAGING -> RECONCILIATION -> ENGINEERING IDENTITY -> IDENTITY CROSSWALK -> MARKET EVIDENCE -> QA/HOLDS -> POSTGIS PUBLICATION -> QGIS -> GOD'S EYE -> CHECKPOINT/RELEASE

## Non-negotiable controls
- PostGIS is canonical spatial truth; QGIS is engineering/QA; GOD'S EYE is operational UI.
- Preserve source provenance and explicit HOLD states.
- No market evidence may mutate Tier-1 geometry.
- Historical asking evidence is not a completed sale, valuation, or proof of current availability.
- No observation means unknown.
- Final cadastral certification requires authoritative evidence; engineering-valid geometry must not be relabeled as authoritative cadastral truth.
- Preserve deterministic IDs, idempotent ingestion, rollback/reopen tests, hashes, manifests, and release checkpoints.
- Never use PostgreSQL port 5432 or touch NovaGreen.
- Phase 9 Block F lineage remains a regression control.

## Phase 9 acceptance baseline
- Engineering plots: 19,285
- Sectors: 16
- Market-bearing plots: 1,068
- Accepted claims: 5,690
- Linked posting events: 15,965
- Held events excluded: 8,305
- Tier-1 market-publication geometry mutations: 0
- Governed QGIS reopen: PASS
- Frontend production build: PASS

This roadmap controls subsequent phase/city replication unless superseded by an explicitly versioned decision.
