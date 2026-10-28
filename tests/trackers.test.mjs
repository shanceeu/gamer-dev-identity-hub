import test from "node:test";
import assert from "node:assert/strict";
import { shapeLeetify } from "../netlify/functions/leetify.mjs";
import { shapeLeague } from "../netlify/functions/league.mjs";
import { shapeRocket } from "../netlify/functions/rocket.mjs";
import { shapeSteam } from "../netlify/functions/steam.mjs";

test("Leetify maps its current profile rating and recent outcomes", () => {
  const data = shapeLeetify({
    steam64_id: "76561199147369622", name: "Player", ranks: { premier: 9999, leetify: -2.39 },
    rating: { aim: 70.1944 }, winrate: 0.4643, total_matches: 14,
    recent_matches: [{ map_name: "de_overpass", outcome: "tie", finished_at: "2026-10-24T16:21:29Z" }],
  });
  assert.equal(data.rating, -2.39);
  assert.equal(data.recent[0].result, "Draw");
  assert.equal(data.rank, 9999);
});

test("League selects solo queue and only the tracked participant", () => {
  const data = shapeLeague(
    [{ queueType: "RANKED_FLEX_SR", tier: "GOLD" }, { queueType: "RANKED_SOLO_5x5", tier: "PLATINUM", rank: "II", leaguePoints: 42, wins: 8, losses: 7 }],
    [{ info: { participants: [{ puuid: "other" }, { puuid: "mine", championName: "Ahri", win: true, kills: 5, deaths: 2, assists: 9 }] } }],
    "mine", "Sm1ted", "Diff",
  );
  assert.equal(data.rank, "PLATINUM II");
  assert.equal(data.recent[0].result, "Win");
  assert.equal(data.recent[0].champion, "Ahri");
});

test("League computes combat and farming views from the tracked player's recent matches", () => {
  const data = shapeLeague([], [
    { info: { gameDuration: 1800, participants: [
      { puuid: "mine", teamId: 100, championName: "Ahri", win: true, kills: 5, deaths: 2, assists: 9, totalMinionsKilled: 120, neutralMinionsKilled: 30, totalDamageDealtToChampions: 12000, goldEarned: 9000, visionScore: 18 },
      { puuid: "ally", teamId: 100, kills: 10 }, { puuid: "enemy", teamId: 200, kills: 20 },
    ] } },
    { info: { gameDuration: 1200, participants: [
      { puuid: "mine", teamId: 100, championName: "Lux", win: false, kills: 2, deaths: 4, assists: 6, totalMinionsKilled: 70, neutralMinionsKilled: 10, totalDamageDealtToChampions: 8000, goldEarned: 6000, visionScore: 10 },
      { puuid: "ally", teamId: 100, kills: 8 }, { puuid: "enemy", teamId: 200, kills: 12 },
    ] } },
  ], "mine", "Sm1ted", "Diff");
  assert.equal(data.recentStats.sample, 2);
  assert.equal(data.recentStats.winRate, 0.5);
  assert.equal(data.recentStats.avgDamage, 10000);
  assert.equal(data.recentStats.csPerMinute, 4.6);
  assert.equal(data.recentStats.goldPerMinute, 300);
  assert.equal(data.recentStats.visionPerMinute, 0.56);
  assert.equal(data.recentStats.kda, 22 / 6);
  assert.equal(data.recentStats.killParticipation, ((14 / 15) + (8 / 10)) / 2);
  assert.deepEqual(data.champions.map(champion => champion.champion), ["Ahri", "Lux"]);
});

test("Rocket stats only count the identified player in replay details", () => {
  const data = shapeRocket([{ id: "x", blue: { goals: 2, players: [{ name: "Matees_czech", stats: { core: { goals: 1, assists: 0, saves: 3 } } }] }, orange: { goals: 1, players: [{ name: "Other", stats: { core: { goals: 1 } } }] } }], { name: "Matees_czech" });
  assert.equal(data.sample, 1);
  assert.equal(data.wins, 1);
  assert.equal(data.saves, 3);
});

test("Steam preserves each game's profile and playtime", () => {
  const data = shapeSteam("76561199147369622", { response: { game_count: 1, games: [{ appid: 730, name: "Counter-Strike 2", playtime_forever: 90 }] } });
  assert.equal(data.count, 1);
  assert.equal(data.games[0].hours, 1.5);
  assert.match(data.profile, /76561199147369622/);
});
