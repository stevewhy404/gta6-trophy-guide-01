// Progress store: the earned ticks live in this browser's localStorage and
// can be exported to a file or imported back. Nothing leaves the browser.
// The key is versioned so a future shape change never reads stale data.

export const PROGRESS_KEY = 'leonida-atlas-progress-v2';

function readIds(raw) {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

export function loadEarned() {
  return readIds(localStorage.getItem(PROGRESS_KEY));
}

export function saveEarned(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

export function toggleEarned(earned, id) {
  const next = new Set(earned);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  saveEarned(next);
  return next;
}

export function exportEarned(earned) {
  const blob = new Blob([JSON.stringify([...earned].sort((a, b) => a - b), null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-atlas-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importEarned(file, total) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('progress file must be a JSON array of trophy ids');
  const ids = new Set(parsed.filter((n) => Number.isInteger(n) && n >= 1 && n <= total));
  saveEarned(ids);
  return ids;
}
