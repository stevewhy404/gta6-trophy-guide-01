// Atlas data: the official trophy list plus this atlas's own guides, kinds
// and flags. Names, descriptions and grades are the official list as
// PlayStation publishes them; the guide, kind and missable flag on each
// trophy are this atlas's own work. Fetch once, then hand out read-only
// views of it.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_LABELS = {
  activity: 'Activity',
  collectible: 'Collectible',
  combat: 'Combat',
  completion: 'Completion',
  exploration: 'Exploration',
  kind: 'Kind',
  mission: 'Mission',
  money: 'Money',
  social: 'Social',
  story: 'Story',
};

let cache = null;

export async function loadAtlas() {
  if (cache) return cache;
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json: HTTP ${res.status}`);
  const doc = await res.json();
  if (!Array.isArray(doc.trophies) || doc.trophies.length !== 55) {
    throw new Error(`trophies.json: expected 55 trophies, got ${doc.trophies?.length}`);
  }
  cache = doc;
  return doc;
}

export function byId(doc, id) {
  return doc.trophies.find((t) => t.id === id) ?? null;
}

export function gradeTotals(doc) {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) out[t.grade] = (out[t.grade] ?? 0) + 1;
  return out;
}

export function missableList(doc) {
  return doc.trophies.filter((t) => t.missable);
}

export function earnedTotals(doc, earned) {
  let got = 0;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) {
    if (earned.has(t.id)) {
      got += 1;
      byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
    }
  }
  return { got, total: doc.trophies.length, byGrade };
}

// The road to the platinum, in the order a player should work it: finish
// the campaign first, pick up what you pass on the way, then grind the
// counters and the money, and finally the two completion trophies.
export function phases(doc) {
  const kinds = (...wanted) => doc.trophies.filter((t) => wanted.includes(t.kind));
  return [
    {
      title: '1 · Play the story',
      blurb: 'Finish the campaign. Story and mission trophies fall out of the plot as you go — the missables live here, so grab them when they come up.',
      list: kinds('story', 'mission'),
    },
    {
      title: '2 · While you are out there',
      blurb: 'Exploration, collectibles and the social beats. Most of these happen on the way to somewhere else — keep an eye out and they stack up.',
      list: kinds('exploration', 'collectible', 'social'),
    },
    {
      title: '3 · Counters and cash',
      blurb: 'The long grinds: activities, combat feats and money. Save these for after the story, when you can chase numbers without the plot pulling you on.',
      list: kinds('activity', 'combat', 'money'),
    },
    {
      title: '4 · The last two',
      blurb: '100% completion, then the platinum. Nothing left to do but watch it pop.',
      list: kinds('completion'),
    },
  ];
}

export function matchesQuery(trophy, query) {
  if (!query) return true;
  const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => word && hay.includes(word));
}
