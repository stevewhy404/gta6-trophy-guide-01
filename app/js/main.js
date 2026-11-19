// Boot: load the atlas, wire the toolbar and tabs, and open the view the URL
// asks for. Deep links: ?view=checklist|roadmap|missables, ?open=<trophy id>,
// and ?seed=<n> marks the first n trophies earned for a demo or a screenshot.
import { loadAtlas } from './data.js';
import { exportEarned, importEarned, loadEarned, saveEarned } from './store.js';
import { renderChecklist, renderDetail, renderMissables, renderProgress, renderRoadmap } from './views.js';

const viewEl = document.getElementById('view');
const detailEl = document.getElementById('detail');

const state = {
  doc: null,
  earned: loadEarned(),
  filters: {
    search: '',
    grade: 'all',
    kind: 'all',
    status: 'all',
    missableOnly: false,
    hideSpoilers: true,
    earned: null,
  },
  view: 'checklist',
  selectedId: null,
  onToggle: null,
  onSelect: null,
};
state.filters.earned = state.earned;

function renderAll() {
  if (state.view === 'roadmap') renderRoadmap(viewEl, state);
  else if (state.view === 'missables') renderMissables(viewEl, state);
  else renderChecklist(viewEl, state);
  renderDetail(detailEl, state);
  renderProgress(state);
}

state.onToggle = (id, checked) => {
  if (checked) state.earned.add(id);
  else state.earned.delete(id);
  saveEarned(state.earned);
  renderAll();
};

state.onSelect = (id) => {
  state.selectedId = id;
  renderAll();
  // On narrow screens the guide sits below the list, so bring it into view.
  // On desktop it is already beside the list and must not move the page.
  if (window.innerWidth < 900) detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function setView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === view);
  }
  renderAll();
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => setView(tab.dataset.view));
}

document.getElementById('search').addEventListener('input', (event) => {
  state.filters.search = event.target.value;
  renderAll();
});
document.getElementById('grade').addEventListener('change', (event) => {
  state.filters.grade = event.target.value;
  renderAll();
});
document.getElementById('kind').addEventListener('change', (event) => {
  state.filters.kind = event.target.value;
  renderAll();
});
document.getElementById('status').addEventListener('change', (event) => {
  state.filters.status = event.target.value;
  renderAll();
});
document.getElementById('missable-only').addEventListener('change', (event) => {
  state.filters.missableOnly = event.target.checked;
  renderAll();
});
document.getElementById('spoilers').addEventListener('change', (event) => {
  state.filters.hideSpoilers = event.target.checked;
  renderAll();
});
document.getElementById('export').addEventListener('click', () => exportEarned(state.earned));
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state.earned = await importEarned(file);
    state.filters.earned = state.earned;
    saveEarned(state.earned);
  } catch {
    // A file that is not progress is ignored; the current ticks stay.
  }
  event.target.value = '';
  renderAll();
});

state.doc = await loadAtlas();

// A demo seed (?seed=13) marks the first n trophies earned in memory, for a
// screenshot or a first look. It is not saved until the reader ticks something.
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed'));
if (Number.isInteger(seed) && seed > 0) {
  for (const trophy of state.doc.trophies.slice(0, Math.min(seed, state.doc.trophies.length))) {
    state.earned.add(trophy.id);
  }
}
const openId = Number(params.get('open'));
if (Number.isInteger(openId) && state.doc.trophies.some((trophy) => trophy.id === openId)) {
  state.selectedId = openId;
}
const viewParam = params.get('view');
if (viewParam === 'roadmap' || viewParam === 'missables') {
  setView(viewParam);
} else {
  renderAll();
}
