// Views: the trophy cards, the detail sheet, the roadmap phases and the
// missables page. All rendering is plain DOM built from the atlas data —
// no framework, no templates fetched over the network.

import { GRADE_ORDER, KIND_LABELS, earnedTotals, gradeTotals, missableList, phases } from './data.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function pill(text, cls = '') {
  return el('span', `pill ${cls}`.trim(), text);
}

function isStoryHidden(trophy, hideSpoilers, earned) {
  return hideSpoilers && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function renderProgress(doc, earned) {
  const { got, total, byGrade } = earnedTotals(doc, earned);
  const totals = gradeTotals(doc);
  document.getElementById('earned-count').textContent = String(got);
  const bar = document.getElementById('progress-bar');
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${total ? Math.round((got / total) * 100) : 0}%`;
  bar.setAttribute('aria-valuenow', String(got));
  const chips = document.getElementById('grade-chips');
  chips.replaceChildren();
  for (const grade of GRADE_ORDER) {
    const chip = el('span', 'chip');
    chip.append(el('span', `dot ${grade}`));
    chip.append(document.createTextNode(`${grade} ${byGrade[grade] ?? 0}/${totals[grade] ?? 0}`));
    chips.append(chip);
  }
}

export function card(doc, trophy, earned, hideSpoilers, onToggle, onOpen) {
  const button = el('button', `tcard grade-${trophy.grade}${earned.has(trophy.id) ? ' is-earned' : ''}`);
  button.type = 'button';
  button.addEventListener('click', (event) => {
    if (event.target.closest('.tick')) return;
    onOpen(trophy);
  });

  const top = el('div', 'tcard-top');
  top.append(el('span', `dot ${trophy.grade}`));
  const name = el('span', 'tcard-name', isStoryHidden(trophy, hideSpoilers, earned) ? 'Story trophy' : trophy.name);
  top.append(name);
  top.append(pill(trophy.grade));
  top.append(pill(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
  if (trophy.missable) top.append(pill('Missable', 'missable'));
  button.append(top);

  if (isStoryHidden(trophy, hideSpoilers, earned)) {
    button.append(el('p', 'hidden-story', 'Hidden until earned — turn off “Hide story spoilers” to see it.'));
  } else {
    button.append(el('p', 'tcard-desc', trophy.description));
    button.append(el('p', 'tcard-guide', trophy.guide));
  }

  const foot = el('div', 'tcard-foot');
  foot.append(el('span', '', `#${trophy.id}`));
  const tick = el('button', 'tick', earned.has(trophy.id) ? 'Earned ✓' : 'Mark earned');
  tick.type = 'button';
  tick.setAttribute('aria-pressed', String(earned.has(trophy.id)));
  tick.addEventListener('click', (event) => {
    event.stopPropagation();
    onToggle(trophy.id);
  });
  foot.append(tick);
  button.append(foot);
  return button;
}

export function renderGrid(doc, earned, filters, onToggle, onOpen) {
  const grid = document.getElementById('grid');
  const shown = doc.trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.earnedOnly && !earned.has(t.id)) return false;
    return true;
  });
  const query = (filters.query ?? '').trim();
  const list = shown.filter((t) => {
    if (!query) return true;
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    return query.toLowerCase().split(/\s+/).every((w) => w && hay.includes(w));
  });
  grid.replaceChildren();
  for (const t of list) grid.append(card(doc, t, earned, filters.hideSpoilers, onToggle, onOpen));
  const note = document.getElementById('result-note');
  note.textContent = list.length === doc.trophies.length
    ? `All ${doc.trophies.length} trophies. Click a card for its full guide.`
    : `Showing ${list.length} of ${doc.trophies.length} trophies.`;
}

export function renderRoadmap(doc, earned) {
  const host = document.getElementById('phases');
  host.replaceChildren();
  for (const phase of phases(doc)) {
    const done = phase.list.filter((t) => earned.has(t.id)).length;
    const box = el('section', 'phase');
    box.append(el('h2', '', `${phase.title} — ${done}/${phase.list.length}`));
    box.append(el('p', '', phase.blurb));
    const ul = el('ul', 'phase-list');
    for (const t of phase.list) {
      const li = el('li', earned.has(t.id) ? 'done' : '', t.name);
      ul.append(li);
    }
    box.append(ul);
    host.append(box);
  }
}

export function renderMissables(doc, earned, onToggle, onOpen) {
  const list = missableList(doc);
  document.getElementById('missable-note').textContent =
    `${doc.missable_rule} That is ${list.length} trophies to watch for — ` +
    `${list.filter((t) => earned.has(t.id)).length} of them already earned.`;
  const grid = document.getElementById('miss-grid');
  grid.replaceChildren();
  for (const t of list) grid.append(card(doc, t, earned, false, onToggle, onOpen));
}

export function fillSheet(doc, trophy, earned, onToggle) {
  const body = document.getElementById('sheet-body');
  body.replaceChildren();
  const top = el('div', 'tcard-top');
  top.append(el('span', `dot ${trophy.grade}`));
  top.append(pill(trophy.grade));
  top.append(pill(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
  if (trophy.missable) top.append(pill('Missable', 'missable'));
  body.append(top);
  body.append(el('h2', '', trophy.name));
  body.append(el('p', 'tcard-desc', trophy.description));
  body.append(el('p', 'guide-label', 'How to get it'));
  body.append(el('p', 'tcard-guide', trophy.guide));
  const meta = el('p', 'sheet-meta',
    `Trophy #${trophy.id} of 55 · Sources: ${trophy.sources.map((s) => doc.source_legend[s] ?? s).join(' · ')}`);
  body.append(meta);
  const tick = el('button', 'tick', earned.has(trophy.id) ? 'Earned ✓ — click to unmark' : 'Mark earned');
  tick.type = 'button';
  tick.setAttribute('aria-pressed', String(earned.has(trophy.id)));
  tick.addEventListener('click', () => onToggle(trophy.id));
  body.append(tick);
}
