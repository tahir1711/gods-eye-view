# Phase 9 PRISM Block F Market Intelligence Panel

## Overview

The Phase 9 Market integration provides real-time access to Block F land plot dealer asking-price claims in Islamabad, Pakistan. The feature adds a market data panel to the God's Eye View geospatial intelligence console, enabling users to query historical pricing and evidence chains for certified plots.

## Architecture

### Components

- **[src/phase9Market.js](../src/phase9Market.js)** — Main module exporting `initPhase9Market()`, which constructs and manages the market UI panel
- **[public/phase9/blockf-market.json](../public/phase9/blockf-market.json)** — Static market snapshot containing 134 plots with 691 independent price claims
- **[src/phase9Market.test.mjs](../src/phase9Market.test.mjs)** — Unit tests for format helpers, data validation, and filtering logic

### Integration Point

The `initPhase9Market()` function is called in [src/main.js](../src/main.js) during app initialization:

```javascript
import { initPhase9Market } from './phase9Market.js';

initPhase9Market();
```

## Features

### 1. Market Panel Button

The market panel is accessed via a button in the top center nav bar (`top-center-actions`):
- **Label:** `F · MARKET`
- **Aria-label:** "Open Phase 9 Prism Block F market data"
- **Styling:** Monospace, 11px, accent color (#b9f5da)

### 2. Search and Filter

Users can search plots by ID using a case-insensitive substring match:
- Query: `F-130` → Matches all plots starting with `F-130*` (e.g., F-1304, F-1305)
- Query: `F-1304` → Exact match
- Results capped at 25 matches to prevent UI overload

### 3. Plot Display

Each plot shows:
- **Plot ID** (e.g., `F-1304`)
- **Claim count** (independent claims observed)
- **Latest asking price** (PKR, bold)
- **Median price**
- **Price range** (min–max)
- **Source-local timestamp** of latest observation
- **Unit assumption flag** (if price unit was inferred from context)
- **Claim history** (collapsible details with evidence SHA256 hashes)

### 4. Data Validation

On panel open, the snapshot is validated:
- `independent_claim_count` must equal **691**
- `observed_plot_count` must equal **134**

If validation fails, the panel displays: *"Market snapshot unavailable: Snapshot count mismatch"*

### 5. Graceful Degradation

- Missing nav element → Panel silently skips initialization
- Network error → Status shows error message
- Invalid snapshot → Status indicates mismatch
- No search results → Message: *"No observed Block F plot matches. Other certified plots have no price claim in this snapshot."*

## Data Format

### Snapshot Structure

```json
{
  "phase": "DHA Phase 9 Prism",
  "block": "F",
  "tier": "Tier 2 dealer asking-price claims",
  "published_at_utc": "2026-09-23T21:22:14.842907+00:00",
  "source_sha256": "F3558C4F7BD...",
  "manifest_sha256": "B2CA47B08CB...",
  "certified_plot_count": 1884,
  "observed_plot_count": 134,
  "independent_claim_count": 691,
  "note": "Asking prices, not completed sales or valuations. Timestamps are source-local.",
  "plots": [ /* array of plot records */ ]
}
```

### Plot Record Structure

```json
{
  "plot_id": "F-1304",
  "claim_count": 5,
  "latest_asking_price_pkr": 35000000,
  "median_asking_price_pkr": 35000000,
  "min_asking_price_pkr": 34500000,
  "max_asking_price_pkr": 35500000,
  "latest_observed_at_local": "2026-05-15T10:00:00",
  "latest_price_unit_assumed": false,
  "history": [
    {
      "observed_at_local": "2026-05-10T08:30:00",
      "asking_price_pkr": 34500000,
      "unit_assumed": false,
      "evidence_sha256": "ABC123DEF456..."
    }
  ]
}
```

## Security & Privacy

### HTML Escaping

All user-facing data (plot IDs, prices, timestamps) is HTML-escaped to prevent XSS:

```javascript
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
```

### No User Input Persistence

Search queries are not stored, logged, or transmitted. Only the snapshot is fetched once per panel open.

### Data Source Attribution

- The snapshot is served from `public/phase9/blockf-market.json`
- Published timestamp is displayed to indicate data freshness
- All prices are explicitly labeled as "dealer asks, not sales or valuations"

## Locale & Formatting

### Number Format

The `en-PK` locale is used for price formatting, which groups by 2 digits in the lakh/crore convention:
- 1,000,000 → `10,00,000` (10 lakh)
- 35,000,000 → `3,50,00,000` (3 crore 50 lakh)

### Currency Label

All prices are prefixed with `PKR ` (Pakistan Rupee).

## Testing

### Unit Tests

[src/phase9Market.test.mjs](../src/phase9Market.test.mjs) includes:

1. **Format Helpers**
   - `fmt()` — en-PK locale number formatting
   - `esc()` — HTML escaping (XSS prevention)
   - `price()` — Currency label + formatting

2. **Snapshot Validation**
   - Exact count checks (691 claims, 134 plots)
   - Field existence verification
   - Published date parsing

3. **Search & Filtering**
   - Substring match (case-insensitive)
   - Result limiting (max 25)
   - No-match handling

4. **Plot Record Structure**
   - Required display fields
   - History array format
   - Plural/singular claim wording
   - Inferred unit flag display

5. **UI Accessibility**
   - Aria-labels presence
   - Element structure
   - Role attributes (e.g., `role="status"` on results)

Run tests:

```bash
npm test
```

### QA/Browser Testing

For DOM integration, event handling, and visual layout tests, use the test runner harness:

```bash
npm run test:track
```

Manual QA checklist:
- [ ] Panel opens/closes on button click
- [ ] Search input filters as-you-type
- [ ] No XSS when searching malicious strings (e.g., `<script>`)
- [ ] History expands/collapses
- [ ] Prices display in en-PK locale
- [ ] Panel is dismissible (close button)
- [ ] Responsive on mobile (min-width constraint)

## Troubleshooting

### "Market snapshot unavailable: HTTP 404"

The file `public/phase9/blockf-market.json` is missing or inaccessible. Verify:
- File exists at the path
- Dev server is serving `/public` correctly
- Build includes the file in dist

### "Market snapshot unavailable: Snapshot count mismatch"

The snapshot data has been corrupted or updated without code changes. Verify:
- `independent_claim_count === 691`
- `observed_plot_count === 134`
- File size is ~155 KB (expected)

### Panel doesn't appear

- Check browser console for errors
- Verify `top-center-actions` nav element exists
- Check that `initPhase9Market()` was called in `src/main.js`

### Prices display incorrectly

Ensure browser locale is set correctly or that Intl.NumberFormat is not overridden.

## Future Enhancements

1. **Live Data Integration** — Replace static snapshot with real-time API endpoint
2. **Plot Geometry** — Show plot boundaries on map when selected
3. **Claim Verification** — Link to evidence documents (PDFs, photos)
4. **Price Trends** — Chart price changes over time
5. **Export** — Download search results as CSV/JSON
6. **Persistent Search** — Save frequent queries

## Related Files

- [README.md](../README.md) — Project overview
- [DATA_SOURCES.md](../DATA_SOURCES.md) — Data source documentation
- [SECURITY.md](../SECURITY.md) — Security guidelines
- [TESTING.md](../TESTING.md) — Testing framework and harnesses
