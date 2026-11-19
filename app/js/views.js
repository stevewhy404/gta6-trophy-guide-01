// Views: the checklist, the trophy guide pane, the roadmap and the missables
// page. All rendering is plain DOM built from the atlas data — no framework.
import { KIND_LABELS, earnedByGrade, gradeCounts, missableTrophies, roadmapPhases } from './data.js';

// Trophies the spoiler setting hides until earned: story trophies, plus the
// one-off story beats that sit in other kinds (the Ocean Beach cocktail, the
// showroom smash, the bowling alley, the partnership moment).
const STORY_BEAT_IDS = new Set([44, 45, 46, 47]);

export function isSpoiler(trophy) {
  return trophy.kind === 'story' || STORY_BEAT_IDS.has(trophy.id);
}

function medalDot(grade) {
  const dot = document.createElement('span');
  dot.className = `medal ${grade}`;
  dot.title = grade;
  return dot;
}

function kindTag(kind) {
  const tag = document.createElement('span');
  tag.className = 'kind-tag';
  tag.textContent = KIND_LABELS[kind] ?? kind;
  return tag;
}

function sourceList(doc, trophy) {
  const list = document.createElement('ul');
  for (const key of trophy.sources) {
    const item = document.createElement('li');
    item.textContent = doc.source_legend[key] ?? key;
    list.append(item);
  }
  return list;
}

function trophyMatches(trophy, filters) {
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

function trophyCard(doc, trophy, state, onSelect) {
  const hidden = state.filters.hideSpoilers && isSpoiler(trophy) && !state.earned.has(trophy.id);
  const card = document.createElement('article');
  card.className = 'trophy' + (state.earned.has(trophy.id) ? ' earned' : '') + (state.selectedId === trophy.id ? ' selected' : '');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(trophy.id);
  box.setAttribute('aria-label', `Earned: ${hidden ? 'hidden trophy' : trophy.name}`);
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', () => state.onToggle(trophy.id, box.checked));

  const name = document.createElement('div');
  const nameLine = document.createElement('div');
  nameLine.className = 'trophy-name';
  if (hidden) {
    nameLine.textContent = 'Hidden trophy ';
    const tag = document.createElement('span');
    tag.className = 'hidden-tag';
    tag.textContent = '(spoilers hidden — earn it to reveal)';
    nameLine.append(tag);
  } else {
    nameLine.textContent = trophy.name;
    if (trophy.missable) {
      const badge = document.createElement('span');
      badge.className = 'badge-missable';
      badge.textContent = 'MISSABLE';
      nameLine.append(badge);
    }
  }
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? 'Hidden on PlayStation — earn it to reveal the name.' : trophy.description;
  name.append(nameLine, desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  meta.textContent = trophy.grade;
  meta.append(document.createElement('br'), kindTag(trophy.kind));

  card.append(box, medalDot(trophy.grade), name, meta);
  card.addEventListener('click', () => onSelect(trophy.id));
  return card;
}

export function renderChecklist(view, state) {
  view.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Checklist — all 55 trophies';
  const note = document.createElement('p');
  note.className = 'section-note';
  note.textContent = 'Tick a trophy when you earn it. Click a row to open its guide beside the list.';
  view.append(heading, note);

  const shown = state.doc.trophies.filter((trophy) => trophyMatches(trophy, state.filters));
  if (shown.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'section-note';
    empty.textContent = 'No trophies match these filters.';
    view.append(empty);
    return;
  }
  for (const trophy of shown) {
    view.append(trophyCard(state.doc, trophy, state, state.onSelect));
  }
  const count = document.createElement('p');
  count.className = 'section-note';
  count.textContent = `Showing ${shown.length} of ${state.doc.trophies.length} trophies.`;
  view.append(count);
}

export function renderDetail(detail, state) {
  detail.replaceChildren();
  const trophy = state.doc.trophies.find((item) => item.id === state.selectedId);
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Select a trophy from the list to open its guide — what to do, where and how, when it can be missed, and where each fact comes from.';
    detail.append(empty);
    return;
  }
  const hidden = state.filters.hideSpoilers && isSpoiler(trophy) && !state.earned.has(trophy.id);
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden trophy' : trophy.name;
  detail.append(medalDot(trophy.grade), title);

  const meta = document.createElement('p');
  meta.className = 'section-note';
  meta.textContent = `${trophy.grade} · ${KIND_LABELS[trophy.kind] ?? trophy.kind}${trophy.missable ? ' · MISSABLE — tied to a single mission or one-off beat' : ''}`;
  detail.append(meta);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Official description hidden until earned.'
    : `Official description: “${trophy.description}”`;
  detail.append(official);

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('div');
  guide.className = 'guide-text';
  const guideText = document.createElement('p');
  guideText.textContent = hidden ? 'Earn this trophy — or switch spoilers off — to read its guide.' : trophy.guide;
  guide.append(guideText);
  detail.append(guideHeading, guide);

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  detail.append(sourcesHeading, sourceList(state.doc, trophy));

  const earnedLine = document.createElement('p');
  earnedLine.className = 'section-note';
  earnedLine.textContent = state.earned.has(trophy.id)
    ? '✓ Earned — ticked off in your checklist.'
    : 'Not earned yet — tick it off in the checklist when it pops.';
  detail.append(earnedLine);
}

export function renderRoadmap(view, state) {
  view.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Roadmap to the platinum';
  const note = document.createElement('p');
  note.className = 'section-note';
  note.textContent = 'Five phases, in order. Finish one phase before the next where you can — the story first, strangers second, activities and collectibles third, heists and money last. Click any trophy to open its guide.';
  view.append(heading, note);
  for (const phase of roadmapPhases(state.doc.trophies)) {
    const block = document.createElement('section');
    block.className = 'roadmap-phase';
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
      dot.className = `mini-medal medal ${trophy.grade}`;
      chip.append(dot, document.createTextNode(trophy.name));
      chip.addEventListener('click', () => state.onSelect(trophy.id));
      block.append(chip);
    }
    view.append(block);
  }
}

export function renderMissables(view, state) {
  view.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Missable trophies';
  const note = document.createElement('p');
  note.className = 'section-note';
  note.textContent = 'These trophies are tied to a single named story mission or a one-off story beat. Story missions can usually be replayed, so treat a flag as “do it when it comes”, not “gone forever”. Each card below says when it can be missed.';
  view.append(heading, note);
  const list = missableTrophies(state.doc.trophies);
  const count = document.createElement('p');
  count.className = 'section-note';
  count.textContent = `${list.length} of 55 trophies are flagged missable.`;
  view.append(count);
  for (const trophy of list) {
    view.append(trophyCard(state.doc, trophy, state, state.onSelect));
  }
}

export function renderProgress(state) {
  const total = state.doc.trophies.length;
  const earnedCount = state.earned.size;
  document.getElementById('earned-count').textContent = String(earnedCount);
  document.getElementById('progress-fill').style.width = `${(earnedCount / total) * 100}%`;
  const totals = gradeCounts(state.doc.trophies);
  const earned = earnedByGrade(state.doc.trophies, state.earned);
  document.getElementById('grade-counts').textContent =
    `Platinum ${earned.platinum}/${totals.platinum} · Gold ${earned.gold}/${totals.gold} · Silver ${earned.silver}/${totals.silver} · Bronze ${earned.bronze}/${totals.bronze}`;
  document.getElementById('platinum-note').textContent =
    earnedCount === total
      ? 'Platinum earned — you are a Leonida Legend.'
      : `${total - earnedCount} to go until the platinum.`;
}
