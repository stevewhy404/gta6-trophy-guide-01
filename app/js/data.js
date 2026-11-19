// Atlas data: the official trophy list plus this atlas's own guides, kinds
// and flags. Names, descriptions and grades are the official list as
// PlayStation publishes them; the guide, kind and missable flag on each
// trophy are this atlas's own work.
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_NAMES = {
  story: 'Story',
  mission: 'Missions',
  activity: 'Activities',
  collectible: 'Collectibles',
  combat: 'Combat & heists',
  exploration: 'Exploration',
  social: 'With your partner',
  money: 'Money',
  completion: '100% completion',
};

export async function loadAtlas() {
  const response = await fetch('data/trophies.json');
  return response.json();
}

export function gradeTotals(trophies) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) totals[trophy.grade] += 1;
  return totals;
}

export function earnedTotals(trophies, earned) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (earned.has(trophy.id)) totals[trophy.grade] += 1;
  }
  return totals;
}

export function missableList(trophies) {
  return trophies.filter((trophy) => trophy.missable);
}

// The roadmap, built from the official descriptions: story first, then the
// stranger strands, then activities and collectibles, then the cleanup that
// finishes 100% completion. Each phase names the trophies it covers.
export function phases(trophies) {
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  const take = (...ids) => ids.map((id) => byId.get(id)).filter(Boolean);
  return [
    {
      title: 'Phase 1 — Play the story',
      text: 'Start with the story and nothing else: opening mission to finale, chapters in order. The chapter pops come on their own, and the missable ones here are single named missions — do each when it shows up.',
      trophies: take(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46, 47, 48, 49, 50),
    },
    {
      title: 'Phase 2 — Strangers across Leonida',
      text: 'Then the strangers. Each one has a strand of missions around the state; finish eight strands for Strangers & Freaks, and take each character finale — Andy, Kenton, Billy, Randy, Tyrone — when its last mission appears.',
      trophies: take(22, 23, 24, 25, 26, 27, 29),
    },
    {
      title: 'Phase 3 — Activities and skills',
      text: 'Then the open-world grind: try every activity once, then chase the counted ones — 250 stunts, 20 races, 50 challenges, gold at the range, drone wins everywhere. No story gates here, so go at your own pace.',
      trophies: take(15, 16, 17, 18, 19, 20, 21, 32, 36, 38, 39, 51),
    },
    {
      title: 'Phase 4 — Collectibles and the map',
      text: 'Collectibles next: meditation spots, card sets, WAiNK tags, vehicles, and every corner of the map. Sweep region by region and use the kind and missable filters to see what is still missing.',
      trophies: take(28, 30, 31, 35, 42),
    },
    {
      title: 'Phase 5 — Heists, money and cleanup',
      text: 'Last: the heists and the money — vaults, armored trucks, gang operations, laundered bills, shop spending, garages. When everything else is ticked, 100% completion pops and the platinum follows.',
      trophies: take(33, 34, 37, 40, 41, 43, 52, 53, 54, 55, 14),
    },
  ];
}
