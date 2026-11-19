// Atlas data: the official trophy list plus this atlas's own guides, kinds
// and flags. Names, descriptions and grades are the official list as
// PlayStation publishes them; the guide, kind and missable flag on each
// trophy are this atlas's own work.
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_LABELS = {
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
  const doc = await response.json();
  return doc;
}

export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) counts[trophy.grade] += 1;
  return counts;
}

export function earnedByGrade(trophies, earned) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (earned.has(trophy.id)) counts[trophy.grade] += 1;
  }
  return counts;
}

export function missableTrophies(trophies) {
  return trophies.filter((trophy) => trophy.missable);
}

// The roadmap, built from the official descriptions: story first, then the
// stranger strands, then activities and collectibles, then the cleanup that
// finishes 100% completion. Each phase names the trophies it covers.
export function roadmapPhases(trophies) {
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  const pick = (...ids) => ids.map((id) => byId.get(id)).filter(Boolean);
  return [
    {
      title: 'Phase 1 — Play the story',
      text: 'Follow the story from the opening mission through the final mission. Chapters and named missions pop as you go; the missable flags in this phase are single missions, so play each when it appears.',
      trophies: pick(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46, 47, 48, 49, 50),
    },
    {
      title: 'Phase 2 — Strangers across Leonida',
      text: 'Meet the strangers marked around the state and follow each strand to its end. Eight finished strands earn Strangers & Freaks; the five character finales are single missions, so finish each strand when it comes.',
      trophies: pick(22, 23, 24, 25, 26, 27, 29),
    },
    {
      title: 'Phase 3 — Activities and skills',
      text: 'Sample every activity once, then chase the skill trophies: stunts, races, fishing, the arcade, the shooting range and the drone races. These are counts and medals, not story moments — grind them at your own pace.',
      trophies: pick(15, 16, 17, 18, 19, 20, 21, 32, 36, 38, 39, 51),
    },
    {
      title: 'Phase 4 — Collectibles and the map',
      text: 'Meditation spots, card sets, WAiNK spots, vehicles and every corner of Leonida. Work region by region so nothing is left, and use the checklist filters to see what remains.',
      trophies: pick(28, 30, 31, 35, 42),
    },
    {
      title: 'Phase 5 — Heists, money and cleanup',
      text: 'Bank vaults, armored trucks, gang operations and the money trophies. Buy the garages last, check the per-kind progress for anything left, and A Long Road — 100% completion — pops with the final item.',
      trophies: pick(33, 34, 37, 40, 41, 43, 52, 53, 54, 55, 14),
    },
  ];
}
