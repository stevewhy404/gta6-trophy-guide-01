// Views: the checklist, the trophy guide pane, the roadmap and the missables
// page. All rendering is plain DOM built from the atlas data — no framework.
import { KIND_NAMES, earnedTotals, gradeTotals, missableList, phases } from './data.js';

// Trophies the spoiler setting hides until earned: story trophies, plus the
// one-off story beats that sit in other kinds (the Ocean Beach cocktail, the
// showroom smash, the bowling alley, the partnership moment).
const HIDDEN_BEATS = new Set([44, 45, 46, 47]);

export function hidesName(trophy) {
  return trophy.kind === 'story' || HIDDEN_BEATS.has(trophy.id);
}

function medal(grade) {
  const dot = document.createElement('span');
  dot.className = `dot ${grade}`;
  dot.title = grade;
  return dot;
}

function kindPill(kind) {
  const pill = document.createElement('span');
  pill.className = 'kind-pill';
  pill.textContent = KIND_NAMES[kind] ?? kind;
  return pill;
}

function sourcesOf(doc, trophy) {
  const list = document.createElement('ul');
  for (const key of trophy.sources) {
    const item = document.createElement('li');
    item.textContent = doc.source_legend[key] ?? key;
    list.append(item);
  }
  return list;
}

function passesFilters(trophy, filters) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.status === 'earned' && !filters.earned.has(trophy.id)) return false;
  if (filters.status === 'missing' && filters.earned.has(trophy.id)) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.search) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function trophyRow(doc, trophy, state) {
  const concealed = state.filters.hideSpoilers && hidesName(trophy) && !state.earned.has(trophy.id);
  const row = document.createElement('article');
  row.className = 'row' + (state.earned.has(trophy.id) ? ' done' : '') + (state.selectedId === trophy.id ? ' picked' : '');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(trophy.id);
  box.setAttribute('aria-label', `Earned: ${concealed ? 'hidden trophy' : trophy.name}`);
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', () => state.onToggle(trophy.id, box.checked));

  const label = document.createElement('div');
  const nameLine = document.createElement('div');
  nameLine.className = 'row-name';
  if (concealed) {
    nameLine.textContent = 'Hidden trophy ';
    const tag = document.createElement('span');
    tag.className = 'spoiler-tag';
    tag.textContent = '(spoilers hidden — earn it to reveal)';
    nameLine.append(tag);
  } else {
    nameLine.textContent = trophy.name;
    if (trophy.missable) {
      const badge = document.createElement('span');
      badge.className = 'flag-missable';
      badge.textContent = 'MISSABLE';
      nameLine.append(badge);
    }
  }
  const desc = document.createElement('div');
  desc.className = 'row-desc';
  desc.textContent = concealed ? 'Hidden on PlayStation — earn it to reveal the name.' : trophy.description;
  label.append(nameLine, desc);

  const meta = document.createElement('div');
  meta.className = 'row-meta';
  meta.textContent = trophy.grade;
  meta.append(document.createElement('br'), kindPill(trophy.kind));

  row.append(box, medal(trophy.grade), label, meta);
  row.addEventListener('click', () => state.onSelect(trophy.id));
  return row;
}

export function showChecklist(pane, state) {
  pane.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Checklist — all 55 trophies';
  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = 'Tick a trophy when you earn it. Click a row to open its guide beside the list.';
  pane.append(heading, note);

  const shown = state.doc.trophies.filter((trophy) => passesFilters(trophy, state.filters));
  if (shown.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No trophies match these filters.';
    pane.append(empty);
    return;
  }
  for (const trophy of shown) pane.append(trophyRow(state.doc, trophy, state));
  const count = document.createElement('p');
  count.className = 'hint';
  count.textContent = `Showing ${shown.length} of ${state.doc.trophies.length} trophies.`;
  pane.append(count);
}

export function showGuide(panel, state) {
  panel.replaceChildren();
  const trophy = state.doc.trophies.find((item) => item.id === state.selectedId);
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'blank';
    empty.textContent = 'Select a trophy from the list to open its guide — what to do, where and how, when it can be missed, and where each fact comes from.';
    panel.append(empty);
    return;
  }
  const concealed = state.filters.hideSpoilers && hidesName(trophy) && !state.earned.has(trophy.id);
  const title = document.createElement('h2');
  title.textContent = concealed ? 'Hidden trophy' : trophy.name;
  panel.append(medal(trophy.grade), title);

  const meta = document.createElement('p');
  meta.className = 'hint';
  meta.textContent = `${trophy.grade} · ${KIND_NAMES[trophy.kind] ?? trophy.kind}${trophy.missable ? ' · MISSABLE — tied to a single mission or one-off beat' : ''}`;
  panel.append(meta);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = concealed
    ? 'Official description hidden until earned.'
    : `Official description: “${trophy.description}”`;
  panel.append(official);

  const guideTitle = document.createElement('h3');
  guideTitle.textContent = 'Guide';
  const guideBody = document.createElement('div');
  guideBody.className = 'guide-body';
  const guideText = document.createElement('p');
  guideText.textContent = concealed ? 'Earn this trophy — or switch spoilers off — to read its guide.' : trophy.guide;
  guideBody.append(guideText);
  panel.append(guideTitle, guideBody);

  const sourcesTitle = document.createElement('h3');
  sourcesTitle.textContent = 'Sources';
  panel.append(sourcesTitle, sourcesOf(state.doc, trophy));

  const earnedLine = document.createElement('p');
  earnedLine.className = 'hint';
  earnedLine.textContent = state.earned.has(trophy.id)
    ? '✓ Earned — ticked off in your checklist.'
    : 'Not earned yet — tick it off in the checklist when it pops.';
  panel.append(earnedLine);
}

export function showRoadmap(pane, state) {
  pane.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Roadmap to the platinum';
  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = 'Five phases, in order. Finish one phase before the next where you can — the story first, strangers second, activities and collectibles third, heists and money last. Click any trophy to open its guide.';
  pane.append(heading, note);
  for (const phase of phases(state.doc.trophies)) {
    const block = document.createElement('section');
    block.className = 'phase';
    const title = document.createElement('h3');
    title.textContent = phase.title;
    const text = document.createElement('p');
    text.textContent = phase.text;
    block.append(title, text);
    for (const trophy of phase.trophies) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (state.earned.has(trophy.id) ? ' done' : '');
      const dot = document.createElement('span');
      dot.className = `mini dot ${trophy.grade}`;
      chip.append(dot, document.createTextNode(trophy.name));
      chip.addEventListener('click', () => state.onSelect(trophy.id));
      block.append(chip);
    }
    pane.append(block);
  }
}

export function showMissables(pane, state) {
  pane.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Missable trophies';
  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = 'These trophies are tied to a single named story mission or a one-off story beat. Story missions can usually be replayed, so treat a flag as “do it when it comes”, not “gone forever”. Each card below says when it can be missed.';
  pane.append(heading, note);
  const list = missableList(state.doc.trophies);
  const count = document.createElement('p');
  count.className = 'hint';
  count.textContent = `${list.length} of 55 trophies are flagged missable.`;
  pane.append(count);
  for (const trophy of list) pane.append(trophyRow(state.doc, trophy, state));
}

export function showProgress(state) {
  const total = state.doc.trophies.length;
  const earnedCount = state.earned.size;
  document.getElementById('earned-num').textContent = String(earnedCount);
  document.getElementById('meter-fill').style.width = `${(earnedCount / total) * 100}%`;
  const totals = gradeTotals(state.doc.trophies);
  const earned = earnedTotals(state.doc.trophies, state.earned);
  document.getElementById('meter-grades').textContent =
    `Platinum ${earned.platinum}/${totals.platinum} · Gold ${earned.gold}/${totals.gold} · Silver ${earned.silver}/${totals.silver} · Bronze ${earned.bronze}/${totals.bronze}`;
  document.getElementById('meter-next').textContent =
    earnedCount === total
      ? 'Platinum earned — you are a Leonida Legend.'
      : `${total - earnedCount} to go until the platinum.`;
}
