// Progress store: the earned ticks live in this browser's localStorage and
// can be exported to a file or imported back. Nothing leaves the browser.
export const PROGRESS_KEY = 'leonida-atlas-progress-v1';

function parseIds(raw) {
  if (!raw) return new Set();
  let ids;
  try {
    ids = JSON.parse(raw);
  } catch {
    return new Set();
  }
  if (!Array.isArray(ids)) return new Set();
  return new Set(ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
}

export function loadProgress() {
  try {
    return parseIds(localStorage.getItem(PROGRESS_KEY));
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  try {
    const sorted = [...earned].sort((a, b) => a - b);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(sorted));
  } catch {
    // Storage full or unavailable: the ticks still work for this visit.
  }
}

export function downloadProgress(earned) {
  const sorted = [...earned].sort((a, b) => a - b);
  const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function readProgressFile(file) {
  const ids = JSON.parse(await file.text());
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  return new Set(ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
}
