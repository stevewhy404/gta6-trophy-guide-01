// Progress store: the earned ticks live in this browser's localStorage, and
// can be exported to a file or imported back. Nothing leaves the browser.
export const STORE_KEY = 'leonida-trophy-atlas-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable: the ticks still work for this visit.
  }
}

export function exportEarned(earned) {
  const blob = new Blob([JSON.stringify([...earned].sort((a, b) => a - b), null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importEarned(file) {
  const text = await file.text();
  const ids = JSON.parse(text);
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  return new Set(ids.filter((id) => Number.isInteger(id)));
}
