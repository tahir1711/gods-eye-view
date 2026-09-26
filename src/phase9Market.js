/** Phase 9 Prism governed read-only market snapshot. Prices are dealer asks. */
const fmt = value => new Intl.NumberFormat('en-PK').format(value);
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const price = value => `PKR ${fmt(value)}`;

export function initPhase9Market() {
  const nav = document.getElementById('top-center-actions');
  if (!nav) return;
  const button = document.createElement('button');
  button.id = 'phase9-market-button';
  button.type = 'button';
  button.textContent = '9P · MARKET';
  button.setAttribute('aria-label', 'Open DHA Phase 9 Prism market data');
  nav.append(button);
  const panel = document.createElement('section');
  panel.id = 'phase9-market-panel';
  panel.setAttribute('aria-label', 'Phase 9 Prism market intelligence');
  panel.hidden = true;
  panel.innerHTML = `<header><strong>DHA PHASE 9 PRISM · FULL MARKET</strong><button type="button" id="phase9-market-close" aria-label="Close market panel">×</button></header>
    <p id="phase9-market-status">Loading governed Phase 9 snapshot…</p>
    <label>Plot ID <input id="phase9-market-search" type="search" placeholder="A-36, F-1304…" autocomplete="off"></label>
    <div id="phase9-market-results" role="status"></div>`;
  document.body.append(panel);

  const style = document.createElement('style');
  style.textContent = `
    #phase9-market-button {width:auto; min-width:92px; font:600 11px monospace; color:#b9f5da}
    #phase9-market-panel {position:fixed;z-index:10020;right:16px;top:76px;width:min(420px,calc(100vw - 32px));max-height:75vh;overflow:auto;background:#101a22f2;color:#e6f3f0;border:1px solid #4a8c7b;border-radius:10px;padding:16px;font:13px/1.5 Inter,sans-serif;box-shadow:0 12px 40px #0009}
    #phase9-market-panel[hidden] {display:none}
    #phase9-market-panel header {display:flex;justify-content:space-between;align-items:center}
    #phase9-market-close {font-size:24px;color:inherit;background:transparent;border:0;cursor:pointer}
    #phase9-market-panel input {display:block;width:100%;box-sizing:border-box;margin:6px 0 12px;padding:9px;background:#1b2d33;color:white;border:1px solid #70948c;border-radius:5px}
    #phase9-market-results article {border-top:1px solid #45635c;padding:12px 0}
    #phase9-market-results small {display:block;color:#b3c7c2}
    #phase9-market-results details {margin-top:8px}
    #phase9-market-results ul {padding-left:20px;max-height:170px;overflow:auto}
  `;
  document.head.append(style);
  const status = panel.querySelector('#phase9-market-status');
  const results = panel.querySelector('#phase9-market-results');
  const search = panel.querySelector('#phase9-market-search');
  let snapshot;

  function render() {
    if (!snapshot) return;
    const query = search.value.trim().toUpperCase();
    const matches = snapshot.plots.filter(p => p.plot_id.includes(query)).slice(0, 25);
    results.innerHTML = matches.length ? matches.map(p => `<article>
      <strong>${esc(p.plot_id)}</strong> · ${p.claim_count} independent claim${p.claim_count === 1 ? '' : 's'}
      <div>Latest ask: <strong>${price(p.latest_asking_price_pkr)}</strong></div>
      <div>Median ask: ${price(p.median_asking_price_pkr)}</div>
      <small>Range: ${price(p.min_asking_price_pkr)} – ${price(p.max_asking_price_pkr)}</small>
      <small>Latest source-local date: ${esc(p.latest_observed_at_local)}${p.latest_price_unit_assumed ? ' · price unit inferred' : ''}</small>
      <details><summary>Claim history and evidence hashes</summary><ul>${p.history.slice().reverse().map(h =>
        `<li>${esc(h.observed_at_local)} · ${price(h.asking_price_pkr)}${h.unit_assumed ? ' · inferred unit' : ''}<small>SHA256: ${esc(h.evidence_sha256)}</small></li>`
      ).join('')}</ul></details></article>`).join('') :
      '<p>No observed plot matches. No observation means unknown, not sold/off-market.</p>';
  }
  button.addEventListener('click', async () => {
    panel.hidden = !panel.hidden;
    if (panel.hidden || snapshot) return;
    try {
      const response = await fetch('/phase9/market.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      snapshot = await response.json();
      if (snapshot.independent_claim_count !== 5690 || snapshot.observed_plot_count !== 1068 || snapshot.engineering_plot_count !== 19285 || snapshot.sector_count !== 16) throw new Error('Snapshot count mismatch');
      status.textContent = `${snapshot.observed_plot_count}/${snapshot.engineering_plot_count} engineering plots have historical asking evidence · ${snapshot.independent_claim_count} claims · published ${snapshot.published_at_utc.slice(0, 10)} UTC. Dealer asks, not sales or valuations.`;
      render();
    } catch (error) { status.textContent = `Phase 9 market publication unavailable: ${error.message}`; }
  });
  panel.querySelector('#phase9-market-close').addEventListener('click', () => { panel.hidden = true; });
  search.addEventListener('input', render);
}
