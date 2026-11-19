// View layer: turns trophy data + state into DOM. No data is hard-coded
// here — every number and label comes from the data module or the state.

import { GRADE_LABELS, GRADE_ORDER, KIND_LABELS, gradeCounts, missableCount, roadmapSteps } from './data.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  const badge = el('span', `grade grade-${grade}`, GRADE_LABELS[grade]);
  return badge;
}

export function renderStats(container, trophies, earned) {
  container.replaceChildren();
  const counts = gradeCounts(trophies);
  const total = trophies.length;
  const done = earned.size;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const headline = el('div', 'stat-headline');
  headline.append(
    el('strong', 'stat-number', `${done} of ${total}`),
    el('span', 'stat-caption', `trophies earned — ${percent}%`),
  );
  container.append(headline);

  const bar = el('div', 'progress-bar');
  const fill = el('div', 'progress-fill');
  fill.style.width = `${percent}%`;
  bar.append(fill);
  container.append(bar);

  const chips = el('div', 'stat-chips');
  for (const grade of GRADE_ORDER) {
    const earnedOfGrade = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    chips.append(el('span', 'chip', `${GRADE_LABELS[grade]} ${earnedOfGrade}/${counts[grade]}`));
  }
  chips.append(el('span', 'chip chip-missable', `Missable ${missableCount(trophies)}`));
  container.append(chips);
}

export function renderRoadmap(container, trophies) {
  container.replaceChildren();
  for (const step of roadmapSteps(trophies)) {
    const card = el('article', 'roadmap-step');
    card.append(el('span', 'roadmap-number', String(step.step)));
    const text = el('div', 'roadmap-text');
    text.append(el('h3', null, step.title), el('p', null, step.body));
    card.append(text);
    container.append(card);
  }
}

// A story trophy stays hidden while the spoiler setting is on and the
// trophy is not earned yet: only its grade shows, never its name or guide.
export function spoilerMasked(trophy, state) {
  return state.spoilerHidden && trophy.kind === 'story' && !state.earned.includes(trophy.id);
}

export function renderCards(container, trophies, state, callbacks) {
  const earned = new Set(state.earned);
  container.replaceChildren();
  if (trophies.length === 0) {
    container.append(el('p', 'empty', 'No trophies match these filters.'));
    return;
  }
  for (const trophy of trophies) {
    const masked = spoilerMasked(trophy, state);
    const card = el('article', 'trophy-card');
    if (earned.has(trophy.id)) card.classList.add('is-earned');
    if (trophy.missable) card.classList.add('is-missable');

    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.checked = earned.has(trophy.id);
    tick.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    tick.addEventListener('change', () => callbacks.onToggle(trophy.id));
    card.append(tick);

    const body = el('div', 'card-body');
    body.append(
      el('h3', 'card-name', masked ? 'Story trophy — hidden until earned' : trophy.name),
      el('p', 'card-desc', masked ? 'Turn the spoiler setting off, or earn it, to see what this is.' : trophy.description),
    );
    const meta = el('div', 'card-meta');
    meta.append(gradeBadge(trophy.grade));
    meta.append(el('span', 'kind', KIND_LABELS[trophy.kind] ?? trophy.kind));
    if (trophy.missable) meta.append(el('span', 'missable-flag', 'Missable'));
    body.append(meta);
    card.append(body);

    const open = el('button', 'card-open', 'Guide');
    open.type = 'button';
    open.addEventListener('click', () => callbacks.onOpen(trophy.id));
    card.append(open);
    container.append(card);
  }
}

export function renderDetail(panel, trophy, state) {
  panel.replaceChildren();
  if (!trophy) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const masked = spoilerMasked(trophy, state);
  const earned = state.earned.includes(trophy.id);
  const head = el('div', 'detail-head');
  head.append(el('h2', null, masked ? 'Story trophy' : trophy.name));
  head.append(gradeBadge(trophy.grade));
  if (trophy.missable) head.append(el('span', 'missable-flag', 'Missable'));
  head.append(el('span', 'kind', KIND_LABELS[trophy.kind] ?? trophy.kind));
  panel.append(head);
  panel.append(el('p', 'detail-desc', masked ? 'This is a story trophy. Its name and guide stay hidden while the spoiler setting is on.' : trophy.description));
  if (!masked) {
    panel.append(el('h3', null, 'How to get it'));
    panel.append(el('p', 'detail-guide', trophy.guide));
  }
  const status = el('p', 'detail-status', earned ? 'Earned — ticked in your tracker.' : 'Not earned yet.');
  panel.append(status);
  const close = el('button', 'detail-close', 'Close');
  close.type = 'button';
  close.addEventListener('click', () => renderDetail(panel, null, state));
  panel.append(close);
  panel.scrollIntoView({ block: 'nearest' });
}
