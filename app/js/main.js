// Bootstrap for the Leonida Trophy Atlas: loads the data, restores state,
// wires the controls, and renders. The page also honours deep links:
// ?grade=silver, ?missable=1 and ?trophy=7 open the matching view on load.

import { filterTrophies, loadTrophies } from './data.js';
import { exportText, importText, loadState, saveState, toggleEarned } from './store.js';
import { renderCards, renderDetail, renderRoadmap, renderStats } from './views.js';

const state = loadState();
const params = new URLSearchParams(window.location.search);
if (params.has('grade')) state.filters.grade = params.get('grade');
if (params.get('missable') === '1') state.filters.missableOnly = true;
if (params.has('kind')) state.filters.kind = params.get('kind');

const statsEl = document.getElementById('stats');
const roadmapEl = document.getElementById('roadmap');
const cardsEl = document.getElementById('cards');
const detailEl = document.getElementById('detail');
const countEl = document.getElementById('shown-count');

const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const kindSelect = document.getElementById('kind');
const missableBox = document.getElementById('missable-only');
const earnedSelect = document.getElementById('earned-filter');
const spoilerBox = document.getElementById('spoiler');
const exportButton = document.getElementById('export');
const importInput = document.getElementById('import');

let trophies = [];
let openTrophyId = null;

function currentFilters() {
  return { ...state.filters, earnedIds: new Set(state.earned) };
}

function render() {
  const visible = filterTrophies(trophies, currentFilters());
  renderStats(statsEl, trophies, new Set(state.earned));
  renderCards(cardsEl, visible, state, {
    onToggle: (id) => {
      toggleEarned(state, id);
      render();
    },
    onOpen: (id) => {
      openTrophyId = id;
      renderDetail(detailEl, trophies.find((t) => t.id === id) ?? null, state);
    },
  });
  countEl.textContent = `Showing ${visible.length} of ${trophies.length} trophies`;
  if (openTrophyId !== null) {
    renderDetail(detailEl, trophies.find((t) => t.id === openTrophyId) ?? null, state);
  }
}

function syncControls() {
  searchInput.value = state.filters.query;
  gradeSelect.value = state.filters.grade;
  kindSelect.value = state.filters.kind;
  missableBox.checked = state.filters.missableOnly;
  earnedSelect.value = state.filters.earned;
  spoilerBox.checked = state.spoilerHidden;
}

searchInput.addEventListener('input', () => {
  state.filters.query = searchInput.value;
  saveState(state);
  render();
});
gradeSelect.addEventListener('change', () => {
  state.filters.grade = gradeSelect.value;
  saveState(state);
  render();
});
kindSelect.addEventListener('change', () => {
  state.filters.kind = kindSelect.value;
  saveState(state);
  render();
});
missableBox.addEventListener('change', () => {
  state.filters.missableOnly = missableBox.checked;
  saveState(state);
  render();
});
earnedSelect.addEventListener('change', () => {
  state.filters.earned = earnedSelect.value;
  saveState(state);
  render();
});
spoilerBox.addEventListener('change', () => {
  state.spoilerHidden = spoilerBox.checked;
  saveState(state);
  render();
});

exportButton.addEventListener('click', () => {
  const blob = new Blob([exportText(state)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

importInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    importText(state, await file.text());
  } catch (error) {
    window.alert(`Could not import that file: ${error.message}`);
  }
  syncControls();
  render();
});

const doc = await loadTrophies();
trophies = doc.trophies;
renderRoadmap(roadmapEl, trophies);
syncControls();
render();

if (params.has('trophy')) {
  const wanted = Number(params.get('trophy'));
  if (Number.isInteger(wanted)) {
    openTrophyId = wanted;
    renderDetail(detailEl, trophies.find((t) => t.id === wanted) ?? null, state);
  }
}
