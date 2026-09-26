-- GOD'S EYE Phase 9 Prism full-phase market publication v1
-- Publication views only. No Tier-1/Tier-2 mutation.
\set ON_ERROR_STOP on
BEGIN;
CREATE OR REPLACE VIEW godseye.phase9_prism_market_history AS
SELECT o.canonical_plot_id,o.observation_id,o.observed_at,o.price_amount AS asking_price_pkr,
o.currency_code,o.price_basis,o.quality_status,o.source_id,s.source_type,s.source_name,
o.source_observation_id,o.evidence_reference,o.evidence_sha256,o.raw_payload_sha256,
o.provenance_notes,o.created_by,o.ingested_at
FROM observations.market_observation o
JOIN provenance.phase9_identity_crosswalk c ON c.canonical_plot_id=o.canonical_plot_id
JOIN market.source_registry s ON s.source_id=o.source_id
WHERE o.phase_code='DHA_PHASE_9_PRISM' AND o.observation_type='ASK' AND o.currency_code='PKR' AND o.quality_status<>'REJECTED';

CREATE OR REPLACE VIEW godseye.phase9_prism_market_summary AS
WITH h AS (SELECT * FROM godseye.phase9_prism_market_history),
stats AS (
 SELECT canonical_plot_id,COUNT(*)::bigint evidence_claim_count,MIN(observed_at) first_observed_at,
 MAX(observed_at) latest_observed_at,MIN(asking_price_pkr) min_asking_price_pkr,
 MAX(asking_price_pkr) max_asking_price_pkr,
 percentile_cont(0.5) WITHIN GROUP (ORDER BY asking_price_pkr) median_asking_price_pkr
 FROM h GROUP BY canonical_plot_id),
latest AS (
 SELECT DISTINCT ON(canonical_plot_id) canonical_plot_id,observation_id latest_observation_id,
 observed_at latest_ask_observed_at,asking_price_pkr latest_asking_price_pkr,
 price_basis latest_price_basis,quality_status latest_quality_status,
 source_type latest_source_type,source_name latest_source_name,evidence_sha256 latest_evidence_sha256
 FROM h ORDER BY canonical_plot_id,observed_at DESC,observation_id DESC)
SELECT q.fid,q.plot_id AS canonical_plot_id,split_part(q.plot_id,'-',1) AS block_code,q.v36_status,q.geom,
COALESCE(s.evidence_claim_count,0)::bigint evidence_claim_count,s.first_observed_at,s.latest_observed_at,
s.min_asking_price_pkr,s.max_asking_price_pkr,s.median_asking_price_pkr,l.latest_observation_id,
l.latest_ask_observed_at,l.latest_asking_price_pkr,l.latest_price_basis,l.latest_quality_status,
l.latest_source_type,l.latest_source_name,l.latest_evidence_sha256,
CASE WHEN s.latest_observed_at IS NULL THEN NULL ELSE EXTRACT(EPOCH FROM(clock_timestamp()-s.latest_observed_at))/86400.0 END evidence_age_days
FROM staging.phase9_v36_engineering_source q
LEFT JOIN stats s ON s.canonical_plot_id=q.plot_id
LEFT JOIN latest l ON l.canonical_plot_id=q.plot_id;

CREATE OR REPLACE VIEW godseye.phase9_prism_market_bearing AS
SELECT * FROM godseye.phase9_prism_market_summary WHERE evidence_claim_count>0;

CREATE OR REPLACE VIEW godseye.phase9_prism_sector_coverage AS
SELECT split_part(canonical_plot_id,'-',1) block_code,COUNT(*)::bigint engineering_plots,
COUNT(*) FILTER(WHERE evidence_claim_count>0)::bigint market_bearing_plots,
COALESCE(SUM(evidence_claim_count),0)::bigint evidence_claims
FROM godseye.phase9_prism_market_summary GROUP BY 1 ORDER BY 1;

REVOKE ALL ON godseye.phase9_prism_market_history,godseye.phase9_prism_market_summary,godseye.phase9_prism_market_bearing,godseye.phase9_prism_sector_coverage FROM PUBLIC;
GRANT SELECT ON godseye.phase9_prism_market_history,godseye.phase9_prism_market_summary,godseye.phase9_prism_market_bearing,godseye.phase9_prism_sector_coverage TO gods_eye_qgis_ro;
COMMENT ON VIEW godseye.phase9_prism_market_summary IS 'Phase 9 Prism engineering geometry plus governed historical dealer ASK summary. No observation means unknown, not sold/off-market. Engineering baseline is not final authoritative cadastral certification.';
COMMIT;
SELECT COUNT(*) AS engineering_plots,COUNT(*) FILTER(WHERE evidence_claim_count>0) AS market_bearing_plots,SUM(evidence_claim_count) AS claims,COUNT(DISTINCT block_code) AS sectors FROM godseye.phase9_prism_market_summary;
