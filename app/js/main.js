// Boot: load the atlas, wire the toolbar and tabs, and open the view the
// URL asks for. Deep links: ?view=guide|roadmap|missables, ?open=<trophy
// id>, and ?seed=<n> marks the first n trophies earned for a demo or a
// screenshot (in memory only — it never writes to localStorage).
// Press / anywhere to jump to the search box.

import { KIND_LABELS, byId, kindTotals, loadAtlas } from './data.js';
import { exportEarned, importEarned, loadEarned, toggleEarned } from './store.js';
import { fillSheet, renderGrid, renderMissables, renderProgress, renderRoadmap } from './views.js';

const params = new URLSearchParams(location.search);

const state = {
  doc: null,
  earned: loadEarned(),
  seeded: null,
  view: params.get('view') === 'roadmap' || params.get('view') === 'missables' ? params.get('view') : 'guide',
  filters: {
    query: '',
    grade: 'all',
    kind: 'all',
    earnedOnly: false,
    hideSpoilers: true,
  },
};

function effectiveEarned() {
  if (state.seeded) return state.seeded;
  return state.earned;
}

function rerender() {
  const earned = effectiveEarned();
  renderProgress(state.doc, earned);
  renderGrid(state.doc, earned, state.filters, onToggle, onOpen);
  renderRoadmap(state.doc, earned);
  renderMissables(state.doc, earned, onToggle, onOpen);
}

function onToggle(id) {
  if (state.seeded) {
    const next = new Set(state.seeded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    state.seeded = next;
  } else {
    state.earned = toggleEarned(state.earned, id);
  }
  rerender();
  const openId = Number(params.get('open'));
  if (openId === id) {
    const trophy = byId(state.doc, id);
    if (trophy) fillSheet(state.doc, trophy, effectiveEarned(), onToggle);
  }
}

function onOpen(trophy) {
  params.set('open', String(trophy.id));
  history.replaceState(null, '', `${location.pathname}?${params}`);
  fillSheet(state.doc, trophy, effectiveEarned(), onToggle);
  document.getElementById('sheet').showModal();
}

function showView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
  document.getElementById('view-guide').classList.toggle('is-visible', view === 'guide');
  document.getElementById('view-roadmap').classList.toggle('is-visible', view === 'roadmap');
  document.getElementById('view-missables').classList.toggle('is-visible', view === 'missables');
  params.set('view', view);
  history.replaceState(null, '', `${location.pathname}?${params}`);
}

async function boot() {
  state.doc = await loadAtlas();

  const seed = Number(params.get('seed'));
  if (Number.isInteger(seed) && seed > 0) {
    state.seeded = new Set(state.doc.trophies.slice(0, Math.min(seed, 55)).map((t) => t.id));
  }

  const kindSelect = document.getElementById('kind-filter');
  const totals = kindTotals(state.doc);
  for (const kind of Object.keys(KIND_LABELS).filter((k) => k !== 'kind').sort()) {
    const option = document.createElement('option');
    option.value = kind;
    option.textContent = `${KIND_LABELS[kind]} (${totals[kind] ?? 0})`;
    kindSelect.append(option);
  }

  const search = document.getElementById('search');
  search.addEventListener('input', (e) => {
    state.filters.query = e.target.value;
    rerender();
  });
  // "/" focuses the search box from anywhere, unless the player is already
  // typing in a field or the detail sheet is open.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.getElementById('sheet').open) return;
    e.preventDefault();
    search.focus();
  });
  document.getElementById('grade-filter').addEventListener('change', (e) => {
    state.filters.grade = e.target.value;
    rerender();
  });
  kindSelect.addEventListener('change', (e) => {
    state.filters.kind = e.target.value;
    rerender();
  });
  document.getElementById('earned-only').addEventListener('change', (e) => {
    state.filters.earnedOnly = e.target.checked;
    rerender();
  });
  const spoiler = document.getElementById('spoiler-hide');
  spoiler.checked = state.filters.hideSpoilers;
  spoiler.addEventListener('change', (e) => {
    state.filters.hideSpoilers = e.target.checked;
    rerender();
  });
  document.getElementById('export-btn').addEventListener('click', () => exportEarned(effectiveEarned()));
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state.earned = await importEarned(file, state.doc.trophies.length);
      state.seeded = null;
      rerender();
    } catch (err) {
      alert(`Could not import that file: ${err.message}`);
    }
    e.target.value = '';
  });
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  }
  document.getElementById('sheet').addEventListener('close', () => {
    params.delete('open');
    history.replaceState(null, '', `${location.pathname}?${params}`);
  });

  showView(state.view);
  rerender();

  const openId = Number(params.get('open'));
  if (openId) {
    const trophy = byId(state.doc, openId);
    if (trophy) {
      fillSheet(state.doc, trophy, effectiveEarned(), onToggle);
      document.getElementById('sheet').showModal();
    }
  }
  window.__atlasReady = true;
}

boot().catch((err) => {
  document.getElementById('grid').textContent = `Could not load the trophy list: ${err.message}`;
  console.error(err);
});
