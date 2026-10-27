const $ = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
const fmt = value => value === null || value === undefined ? "—" : new Intl.NumberFormat("en").format(value);
const date = value => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(parsed);
};
const percent = value => value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;

function metric(label, value) {
  const node = make("div", "metric");
  node.append(make("span", "metric-value", value), make("span", "metric-label", label));
  return node;
}

function metrics(items) {
  const node = make("div", "metrics");
  for (const [label, value] of items) node.append(metric(label, value));
  return node;
}

function message(root, data) {
  const box = make("div", `message ${data.state === "error" ? "message-error" : ""}`);
  box.append(make("strong", "", data.state === "error" ? "Stats unavailable" : "Connect this tracker"));
  box.append(make("p", "", data.message || "No data available yet."));
  if (data.source) {
    const link = make("a", "text-link", "Open profile ↗");
    link.href = data.source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    box.append(link);
  }
  root.replaceChildren(box);
}

function matchList(items, formatter) {
  const list = make("div", "match-list");
  const heading = make("div", "list-heading");
  heading.append(make("span", "", "Recent matches"), make("span", "", `${items.length} shown`));
  list.append(heading);
  if (!items.length) { list.append(make("p", "empty", "No recent matches available.")); return list; }
  for (const item of items) {
    const row = make("div", "match-row");
    const left = make("div", "match-main");
    left.append(make("strong", "", formatter(item)), make("small", "", date(item.date)));
    row.append(left);
    if (item.result) row.append(make("span", `result ${item.result.toLowerCase()}`, item.result));
    list.append(row);
  }
  return list;
}

function renderLeetify(data) {
  const root = $('[data-content="leetify"]');
  if (data.state !== "ready") return message(root, data);
  const content = document.createDocumentFragment();
  content.append(make("p", "player-name", data.name));
  content.append(metrics([
    ["Premier rating", fmt(data.rank)],
    ["Win rate", percent(data.winRate)],
    ["Tracked matches", fmt(data.matches)],
  ]));
  const detail = make("div", "detail-line");
  detail.append(make("span", "", "Leetify rating"), make("strong", "", data.rating === null ? "—" : data.rating.toFixed(1)));
  detail.append(make("span", "", "Aim rating"), make("strong", "", data.aim === null ? "—" : data.aim.toFixed(1)));
  content.append(detail, matchList(data.recent, item => item.map));
  root.replaceChildren(content);
}

function renderLeague(data) {
  const root = $('[data-content="league"]');
  if (data.state !== "ready") return message(root, data);
  const content = document.createDocumentFragment();
  content.append(make("p", "player-name", data.name));
  content.append(metrics([
    ["Solo queue", data.rank],
    ["League points", fmt(data.lp)],
    ["Ranked record", data.wins === null ? "—" : `${data.wins}W · ${data.losses ?? 0}L`],
  ]));
  content.append(matchList(data.recent, item => `${item.champion} · ${item.kills}/${item.deaths}/${item.assists}`));
  root.replaceChildren(content);
}

function renderRocket(data) {
  const root = $('[data-content="rocket"]');
  if (data.state !== "ready") return message(root, data);
  const content = document.createDocumentFragment();
  content.append(make("p", "player-name", data.name));
  if (!data.sample) {
    content.append(make("p", "empty", "No matching public uploaded replays were found. Your live profile is linked above."));
  } else {
    content.append(metrics([
      ["Replay wins", `${data.wins} / ${data.sample}`],
      ["Goals", fmt(data.goals)],
      ["Saves", fmt(data.saves)],
    ]));
    content.append(matchList(data.recent, item => `${item.playlist} · ${item.goals ?? "—"}G ${item.assists ?? "—"}A ${item.saves ?? "—"}S`));
  }
  content.append(make("p", "source-note", data.note));
  root.replaceChildren(content);
}

let steamLibraries = [];
let steamShown = 12;
let steamReady = false;

function renderSteam() {
  if (!steamReady) return;
  const root = $("#steam-content");
  const query = $("#steam-search").value.trim().toLowerCase();
  const selected = $("#steam-profile").value;
  const games = steamLibraries
    .filter(library => selected === "all" || library.id === selected)
    .flatMap(library => library.games.map(game => ({ ...game, profile: library.id })))
    .filter(game => game.name.toLowerCase().includes(query))
    .sort((a, b) => b.recentHours - a.recentHours || b.hours - a.hours);
  const content = document.createDocumentFragment();
  const list = make("div", "games-list");
  for (const game of games.slice(0, steamShown)) {
    const row = make("a", "game-row");
    row.href = `https://store.steampowered.com/app/${game.id}/`;
    row.target = "_blank";
    row.rel = "noopener noreferrer";
    if (game.icon) { const icon = make("img", "game-icon"); icon.src = game.icon; icon.alt = ""; icon.loading = "lazy"; row.append(icon); }
    else row.append(make("span", "game-icon fallback", ""));
    const name = make("span", "game-name");
    name.append(make("strong", "", game.name), make("small", "", `Steam ${game.profile.slice(-4)}`));
    row.append(name, make("span", "game-hours", `${fmt(game.hours)} h`));
    list.append(row);
  }
  if (games.length) content.append(list);
  else content.append(make("p", "empty", query ? "No games match that search." : "No visible games in these libraries."));
  if (games.length > steamShown) {
    const more = make("button", "show-more", `Show more games · ${games.length - steamShown} remaining`);
    more.type = "button";
    more.addEventListener("click", () => { steamShown += 24; renderSteam(); });
    content.append(more);
  }
  root.replaceChildren(content);
}

function renderSteamData(data) {
  const root = $("#steam-content");
  if (data.state !== "ready") {
    steamReady = false;
    steamLibraries = [];
    $("#steam-search").disabled = true;
    $("#steam-profile").disabled = true;
    message(root, data);
    const links = make("div", "profile-links");
    for (const id of data.ids || []) {
      const link = make("a", "text-link", `Steam ${id.slice(-4)} ↗`);
      link.href = `https://steamcommunity.com/profiles/${id}/games/`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      links.append(link);
    }
    root.append(links);
    return;
  }
  steamLibraries = data.libraries;
  steamReady = true;
  $("#steam-search").disabled = false;
  $("#steam-profile").disabled = false;
  $("#steam-count").textContent = `${steamLibraries.reduce((sum, item) => sum + item.count, 0)} games · ${steamLibraries.length} profiles`;
  const select = $("#steam-profile");
  select.replaceChildren(new Option("All profiles", "all"));
  for (const library of steamLibraries) select.add(new Option(`Steam ${library.id.slice(-4)} · ${library.count} games`, library.id));
  steamShown = 12;
  renderSteam();
}

async function load(name, render) {
  try {
    const response = await fetch(`/api/${name}`, { cache: "no-store" });
    const data = await response.json();
    render(data);
  } catch {
    render({ state: "error", message: "Could not reach this tracker. Try refreshing the page." });
  }
}

async function refresh() {
  const button = $("#refresh");
  button.disabled = true;
  $("#updated").textContent = "Checking stats…";
  await Promise.all([
    load("rocket", renderRocket), load("leetify", renderLeetify),
    load("league", renderLeague), load("steam", renderSteamData),
  ]);
  $("#updated").textContent = `Checked ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
  button.disabled = false;
}

$("#refresh").addEventListener("click", refresh);
$("#steam-search").addEventListener("input", () => { steamShown = 12; renderSteam(); });
$("#steam-profile").addEventListener("change", () => { steamShown = 12; renderSteam(); });
refresh();
