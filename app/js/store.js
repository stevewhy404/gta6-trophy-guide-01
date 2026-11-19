// State layer: what the player has earned, whether story trophies are
// hidden until earned, and the current filter choices. Everything lives in
// localStorage under one versioned key, so progress survives reloads and can
// be exported and imported as JSON.

const STORAGE_KEY = 'leonida-trophy-atlas-v1';

export function defaultState() {
  return {
    earned: [],
    spoilerHidden: true,
    filters: {
      grade: 'all',
      kind: 'all',
      missableOnly: false,
      earned: 'all',
      query: '',
    },
  };
}

export function loadState() {
  const state = defaultState();
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) return state;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== 'object') return state;
  if (Array.isArray(parsed.earned)) {
    state.earned = parsed.earned.filter((id) => Number.isInteger(id));
  }
  if (typeof parsed.spoilerHidden === 'boolean') {
    state.spoilerHidden = parsed.spoilerHidden;
  }
  if (parsed.filters && typeof parsed.filters === 'object') {
    state.filters = { ...state.filters, ...parsed.filters };
  }
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: progress just does not persist.
  }
}

export function earnedSet(state) {
  return new Set(state.earned);
}

export function toggleEarned(state, trophyId) {
  const earned = earnedSet(state);
  if (earned.has(trophyId)) earned.delete(trophyId);
  else earned.add(trophyId);
  state.earned = [...earned].sort((a, b) => a - b);
  saveState(state);
  return state;
}

export function exportText(state) {
  return JSON.stringify({ exported: 'leonida-trophy-atlas', earned: state.earned }, null, 2);
}

// Import accepts either the exported document or a bare array of ids.
export function importText(state, text) {
  const parsed = JSON.parse(text);
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('not a trophy progress file');
  const clean = ids.filter((id) => Number.isInteger(id));
  state.earned = [...new Set(clean)].sort((a, b) => a - b);
  saveState(state);
  return state;
}
