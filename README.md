# Matees / game stats

A Netlify-ready personal game dashboard for Rocket League, Counter-Strike 2, League of Legends, and three Steam libraries. It uses server-side Netlify Functions so API keys are never sent to the browser.

## Accounts configured

| Tracker | Account |
| --- | --- |
| CS2 / Leetify | [Steam 76561199147369622](https://leetify.com/app/profile/76561199147369622) |
| Rocket League | [Epic Matees_czech](https://rocketleague.tracker.network/rocket-league/profile/epic/Matees_czech/overview) |
| League of Legends | [Sm1ted#Diff, EUNE](https://tracker.gg/lol/profile/riot/Sm1ted%23Diff/overview) |
| Steam libraries | [69622](https://steamcommunity.com/profiles/76561199147369622/), [54269](https://steamcommunity.com/profiles/76561199113854269/), [18684](https://steamcommunity.com/profiles/76561199527518684/) |

## Deploy on Netlify

1. Import this repository as a new Netlify site. `netlify.toml` already sets the publish directory to `public` and enables functions.
2. In **Site configuration → Environment variables**, add the variables below. Copy the values from `.env.example` for the account IDs. Add API keys only in Netlify, never in Git.
3. Deploy the site. Leetify works with the configured Steam ID immediately; the other API-backed sections show setup guidance until their keys are present.

| Variable | Purpose |
| --- | --- |
| `LEETIFY_STEAM64_ID` | `76561199147369622`. Leetify API requests work without a key, but the optional `LEETIFY_API_KEY` gives better rate limits. |
| `RIOT_GAME_NAME`, `RIOT_TAGLINE`, `RIOT_PLATFORM` | `Sm1ted`, `Diff`, `eun1`. |
| `RIOT_API_KEY` | Required for ranked League data. Get a key from the [Riot Developer Portal](https://developer.riotgames.com/). Development keys expire after 24 hours; a public site needs an appropriate production key. |
| `BALLCHASING_API_KEY` | Optional for Rocket League replay stats. Generate it at [ballchasing](https://ballchasing.com/doc/api). |
| `BALLCHASING_PLAYER_NAME` | Defaults to `Matees_czech`. A name search may include another player with the same name; set `BALLCHASING_PLAYER_ID` to a verified `platform:id` for an exact match. |
| `STEAM_API_KEY` | Required to show owned games via [Steam's GetOwnedGames API](https://partner.steamgames.com/doc/webapi/iplayerservice). The three Steam IDs are in `STEAM_IDS`. Libraries must be visible to the API. |

Rocket League's live Tracker Network page is always linked. Its public API is not available for this use, and the official Rocket League stats socket broadcasts only while the game is running locally. The optional ballchasing data covers **public uploaded replays only**, so its totals are a sample and do not represent career totals or live rank. Console players cannot upload replays directly. The dashboard does not scrape Tracker Network.

Leetify returns data only for users who are registered and visible under its privacy settings. Steam may return an empty library for a private game-details setting. In both cases, check the linked profile and account visibility.

## Local development

Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run `netlify dev` from the repository root. Set the same environment variables in your local Netlify environment. Run `node --test` for the data-shaping tests. The frontend has no build step or package dependencies.

## Sources

- [Leetify public API](https://api-public-docs.cs-prod.leetify.com/)
- [Riot API and routing](https://developer.riotgames.com/docs/lol)
- [ballchasing API](https://ballchasing.com/doc/api)
- [Steam GetOwnedGames](https://partner.steamgames.com/doc/webapi/iplayerservice)
