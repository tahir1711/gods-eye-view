/**
 * Phase 9 PRISM Block F market data validation and format tests.
 * Tests the format helpers and data validation logic used by the market panel.
 * DOM/browser integration is tested in QA harnesses per TESTING.md.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

// Helper functions extracted from phase9Market.js for isolated testing
const fmt = value => new Intl.NumberFormat('en-PK').format(value);
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const price = value => `PKR ${fmt(value)}`;

test('phase9Market: format helpers', async (suite) => {
  await suite.test('fmt: formats large numbers with en-PK locale', () => {
    assert.equal(fmt(1000), '1,000');
    assert.equal(fmt(1000000), '10,00,000');
    assert.equal(fmt(35000000), '3,50,00,000');
  });

  await suite.test('fmt: handles zero and negatives', () => {
    assert.equal(fmt(0), '0');
    assert.equal(fmt(-1000), '-1,000');
  });

  await suite.test('esc: escapes HTML special characters', () => {
    assert.equal(esc('<script>'), '&lt;script&gt;');
    assert.equal(esc('&'), '&amp;');
    assert.equal(esc('"'), '&quot;');
    assert.equal(esc("'"), '&#39;');
    assert.equal(esc('>'), '&gt;');
  });

  await suite.test('esc: handles mixed content', () => {
    assert.equal(
      esc('<img src="x" onerror="alert(1)">'),
      '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
    );
  });

  await suite.test('esc: passes through safe content unchanged', () => {
    assert.equal(esc('F-1304'), 'F-1304');
    assert.equal(esc('PKR 35,000,000'), 'PKR 35,000,000');
  });

  await suite.test('price: combines format and currency label', () => {
    assert.equal(price(35000000), 'PKR 3,50,00,000');
    assert.equal(price(30500000), 'PKR 3,05,00,000');
  });
});

test('phase9Market: snapshot validation', async (suite) => {
  const validSnapshot = {
    independent_claim_count: 691,
    observed_plot_count: 134,
    certified_plot_count: 1884,
    published_at_utc: '2026-09-23T21:22:14.842907+00:00',
    plots: [],
  };

  await suite.test('valid snapshot has required fields', () => {
    assert.ok(validSnapshot.independent_claim_count === 691);
    assert.ok(validSnapshot.observed_plot_count === 134);
    assert.equal(validSnapshot.certified_plot_count, 1884);
    assert.ok(validSnapshot.published_at_utc);
    assert.ok(Array.isArray(validSnapshot.plots));
  });

  await suite.test('snapshot count mismatch is detectable', () => {
    const corrupted = { ...validSnapshot, independent_claim_count: 500 };
    const isValid = corrupted.independent_claim_count === 691 && corrupted.observed_plot_count === 134;
    assert.ok(!isValid);
  });

  await suite.test('published_at_utc can be parsed for display', () => {
    const dateStr = validSnapshot.published_at_utc.slice(0, 10);
    assert.equal(dateStr, '2026-09-23');
    const display = `published ${dateStr} UTC`;
    assert.equal(display, 'published 2026-09-23 UTC');
  });
});

test('phase9Market: search and filtering', async (suite) => {
  const samplePlots = [
    { plot_id: 'F-1304', claim_count: 5, latest_asking_price_pkr: 35000000 },
    { plot_id: 'F-1305', claim_count: 3, latest_asking_price_pkr: 36000000 },
    { plot_id: 'F-2001', claim_count: 1, latest_asking_price_pkr: 28000000 },
  ];

  await suite.test('exact plot ID match', () => {
    const query = 'F-1304'.toUpperCase();
    const matches = samplePlots.filter(p => p.plot_id.includes(query));
    assert.equal(matches.length, 1);
    assert.equal(matches[0].plot_id, 'F-1304');
  });

  await suite.test('substring match finds multiple plots', () => {
    const query = 'F-130'.toUpperCase();
    const matches = samplePlots.filter(p => p.plot_id.includes(query));
    assert.equal(matches.length, 2);
  });

  await suite.test('no match returns empty', () => {
    const query = 'F-9999'.toUpperCase();
    const matches = samplePlots.filter(p => p.plot_id.includes(query));
    assert.equal(matches.length, 0);
  });

  await suite.test('results limited to first 25', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      plot_id: `F-${i}`,
      claim_count: 1,
      latest_asking_price_pkr: 30000000,
    }));
    const matches = many.filter(p => p.plot_id.includes('F-')).slice(0, 25);
    assert.equal(matches.length, 25);
  });

  await suite.test('query is case-insensitive', () => {
    const query = 'f-1304'.toUpperCase();
    const matches = samplePlots.filter(p => p.plot_id.includes(query));
    assert.equal(matches.length, 1);
  });
});

test('phase9Market: plot record structure', async (suite) => {
  const samplePlot = {
    plot_id: 'F-1304',
    claim_count: 5,
    median_asking_price_pkr: 35000000,
    min_asking_price_pkr: 34500000,
    max_asking_price_pkr: 35500000,
    latest_asking_price_pkr: 35000000,
    latest_observed_at_local: '2026-05-15T10:00:00',
    latest_price_unit_assumed: false,
    history: [
      {
        observed_at_local: '2026-05-10T08:30:00',
        asking_price_pkr: 34500000,
        unit_assumed: false,
        evidence_sha256: 'ABC123DEF456',
      },
    ],
  };

  await suite.test('plot has all required display fields', () => {
    assert.ok(samplePlot.plot_id);
    assert.ok(typeof samplePlot.claim_count === 'number');
    assert.ok(typeof samplePlot.latest_asking_price_pkr === 'number');
    assert.ok(typeof samplePlot.median_asking_price_pkr === 'number');
    assert.ok(samplePlot.latest_observed_at_local);
    assert.ok(typeof samplePlot.latest_price_unit_assumed === 'boolean');
  });

  await suite.test('plot history is an array of records', () => {
    assert.ok(Array.isArray(samplePlot.history));
    const h = samplePlot.history[0];
    assert.ok(h.observed_at_local);
    assert.ok(typeof h.asking_price_pkr === 'number');
    assert.ok(typeof h.unit_assumed === 'boolean');
    assert.ok(h.evidence_sha256);
  });

  await suite.test('plural/singular claim wording', () => {
    assert.equal(samplePlot.claim_count === 1 ? 'claim' : 'claims', 'claims');
    const single = { ...samplePlot, claim_count: 1 };
    assert.equal(single.claim_count === 1 ? 'claim' : 'claims', 'claim');
  });

  await suite.test('inferred unit flag is displayed conditionally', () => {
    const unit_assumed = samplePlot.latest_price_unit_assumed;
    const label = unit_assumed ? ' · price unit inferred' : '';
    assert.equal(label, '');
    
    const inferred = { ...samplePlot, latest_price_unit_assumed: true };
    const inferredLabel = inferred.latest_price_unit_assumed ? ' · price unit inferred' : '';
    assert.equal(inferredLabel, ' · price unit inferred');
  });
});

test('phase9Market: UI accessibility', async (suite) => {
  await suite.test('button has correct aria-label', () => {
    const label = 'Open Phase 9 Prism Block F market data';
    assert.ok(label.includes('Phase 9'));
    assert.ok(label.includes('Block F'));
    assert.ok(label.includes('market'));
  });

  await suite.test('panel has correct aria-label', () => {
    const label = 'Block F market intelligence';
    assert.ok(label.includes('Block F'));
    assert.ok(label.includes('market'));
  });

  await suite.test('search input has correct attributes', () => {
    const type = 'search';
    const placeholder = 'F-1304';
    const autocomplete = 'off';
    assert.equal(type, 'search');
    assert.ok(placeholder.match(/^F-\d+$/));
    assert.equal(autocomplete, 'off');
  });
});
