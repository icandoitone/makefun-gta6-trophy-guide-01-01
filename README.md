[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/icandoitone/makefun-gta6-trophy-guide-01-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/icandoitone/makefun-gta6-trophy-guide-01-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Atlas — a GTA VI trophy guide and tracker

An offline guide and checklist for every PlayStation 5 trophy in Grand Theft
Auto VI: all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with their
official names, descriptions and grades as PlayStation publishes them, a
guide in plain words for each one with its sources named beside it, and a
tracker that keeps your progress on your own device.

## Use it

Serve the `app/` folder with any static server and open `index.html` — for
example, `python3 -m http.server` inside `app/`. The app makes no network
request while it runs; it only reads its own `data/trophies.json` from the
same folder.

- **Checklist** — tick a trophy when you earn it. Progress is saved in the
  browser's localStorage, so it survives reloads and stays on your device.
- **Export / import** — export your progress to a JSON file and import it
  back later, or on another browser.
- **Filters** — story, missable, collectibles, activities, online (the
  online list is empty on purpose: GTA 6 has no online trophies).
- **Spoiler setting** — hide the names and descriptions of story trophies
  until you earn them.
- **Roadmap** — three steps to the platinum: play the story, the 100%
  checklist, then Strangers & cleanup, with the one possibly-missable
  trophy flagged before you can miss it.

## What's inside

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself.
- `app/data/trophies.json` — the 55 trophies: official name, description,
  grade, hidden and missable flags, and a guide with sources for each.
- `screenshots/` — real renders of the app.
- `main.ts` — copies `app/` and `screenshots/` into an output directory
  and writes `dossier.json` with the vendored make.fun library
  (`vendor/makefun-frontend.ts`). Run it with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`. Node 22, standard library only.

## About the guides

Every guide is written in our own words for this entry, and each one names
its sources — PowerPyx, Exophase, GTA Zone, GTABase, PSNProfiles and
TrueTrophies — beside the guide. Where no guide had pinned down an unlock
yet at launch, the guide says so plainly instead of guessing. Trophy names,
descriptions and grades are quoted exactly as PlayStation publishes them.

Leonida Trophy Atlas is an unofficial fan guide. Grand Theft Auto and GTA
are trademarks of Rockstar Games. Not affiliated with Rockstar Games, Sony
or PlayStation.
