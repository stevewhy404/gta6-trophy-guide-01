// Boot: load the atlas, wire the toolbar and tabs, and open the view the URL
// asks for. Deep links: ?view=checklist|roadmap|missables, ?open=<trophy id>,
// and ?seed=<n> marks the first n trophies earned for a demo or a screenshot.
import { loadAtlas } from './data.js';
import { downloadProgress, loadProgress, readProgressFile, saveProgress } from './store.js';
import { showChecklist, showGuide, showMissables, showProgress, showRoadmap } from './views.js';

const paneEl = document.getElementById('pane');
const guideEl = document.getElementById('guide');

const app = {
  doc: null,
  earned: loadProgress(),
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
app.filters.earned = app.earned;

function paint() {
  if (app.view === 'roadmap') showRoadmap(paneEl, app);
  else if (app.view === 'missables') showMissables(paneEl, app);
  else showChecklist(paneEl, app);
  showGuide(guideEl, app);
  showProgress(app);
}

app.onToggle = (id, checked) => {
  if (checked) app.earned.add(id);
  else app.earned.delete(id);
  saveProgress(app.earned);
  paint();
};

app.onSelect = (id) => {
  app.selectedId = id;
  paint();
  // On narrow screens the guide sits below the list, so bring it into view.
  // On desktop it is already beside the list and must not move the page.
  if (window.innerWidth < 900) guideEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function switchView(view) {
  app.view = view;
  for (const tab of document.querySelectorAll('.view-btn')) {
    tab.classList.toggle('on', tab.dataset.view === view);
  }
  paint();
}

for (const tab of document.querySelectorAll('.view-btn')) {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
}

document.getElementById('q').addEventListener('input', (event) => {
  app.filters.search = event.target.value;
  paint();
});
document.getElementById('grade-sel').addEventListener('change', (event) => {
  app.filters.grade = event.target.value;
  paint();
});
document.getElementById('kind-sel').addEventListener('change', (event) => {
  app.filters.kind = event.target.value;
  paint();
});
document.getElementById('status-sel').addEventListener('change', (event) => {
  app.filters.status = event.target.value;
  paint();
});
document.getElementById('missable-only').addEventListener('change', (event) => {
  app.filters.missableOnly = event.target.checked;
  paint();
});
document.getElementById('hide-spoilers').addEventListener('change', (event) => {
  app.filters.hideSpoilers = event.target.checked;
  paint();
});
document.getElementById('export-btn').addEventListener('click', () => downloadProgress(app.earned));
document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    app.earned = await readProgressFile(file);
    app.filters.earned = app.earned;
    saveProgress(app.earned);
  } catch {
    // A file that is not progress is ignored; the current ticks stay.
  }
  event.target.value = '';
  paint();
});

app.doc = await loadAtlas();

// A demo seed (?seed=13) marks the first n trophies earned in memory, for a
// screenshot or a first look. It is not saved until the reader ticks something.
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed'));
if (Number.isInteger(seed) && seed > 0) {
  for (const trophy of app.doc.trophies.slice(0, Math.min(seed, app.doc.trophies.length))) {
    app.earned.add(trophy.id);
  }
}
const openId = Number(params.get('open'));
if (Number.isInteger(openId) && app.doc.trophies.some((trophy) => trophy.id === openId)) {
  app.selectedId = openId;
}
const viewParam = params.get('view');
if (viewParam === 'roadmap' || viewParam === 'missables') {
  switchView(viewParam);
} else {
  paint();
}
