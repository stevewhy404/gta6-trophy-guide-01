// Data layer for the Leonida Trophy Atlas: loads the trophy list and derives
// every count the app shows, so the numbers on screen always come from the
// data file and never from a hard-coded constant.

const DATA_URL = 'data/trophies.json';

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABELS = {
  story: 'Story',
  activity: 'Activity',
  collectible: 'Collectible',
  combat: 'Combat',
  exploration: 'Exploration',
  completion: 'Completion',
  economy: 'Economy',
};

export async function loadTrophies() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`trophy data failed to load (${response.status})`);
  }
  const doc = await response.json();
  const list = Array.isArray(doc.trophies) ? doc.trophies : [];
  return { meta: doc, trophies: list };
}

// Count trophies per grade, straight from the loaded data.
export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (Object.hasOwn(counts, trophy.grade)) counts[trophy.grade] += 1;
  }
  return counts;
}

export function missableCount(trophies) {
  return trophies.filter((trophy) => trophy.missable === true).length;
}

export function kindCounts(trophies) {
  const counts = {};
  for (const trophy of trophies) {
    counts[trophy.kind] = (counts[trophy.kind] ?? 0) + 1;
  }
  return counts;
}

// The roadmap the guide recommends: story first, missables while you are
// there, then everything that can be cleaned up in free roam.
export function roadmapSteps(trophies) {
  const story = trophies.filter((t) => t.kind === 'story').length;
  const missable = missableCount(trophies);
  const cleanup = trophies.length - story;
  return [
    {
      step: 1,
      title: 'Play the story',
      body: `${story} story trophies unlock by finishing chapters and missions. Nothing here needs a special build — just play.`,
    },
    {
      step: 2,
      title: `Watch the ${missable} missables`,
      body: 'Missable trophies belong to one-time story beats. Do them while the moment is live; after the credits the only way back is a new game or chapter replay.',
    },
    {
      step: 3,
      title: `Clean up the other ${cleanup}`,
      body: 'Activities, collectibles, combat and exploration stay open in free roam after the story. Filter by kind and sweep them up last.',
    },
  ];
}

export function filterTrophies(trophies, filters) {
  const query = (filters.query ?? '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
    if (filters.missableOnly && trophy.missable !== true) return false;
    if (filters.earned === 'earned' && !filters.earnedIds.has(trophy.id)) return false;
    if (filters.earned === 'missing' && filters.earnedIds.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
