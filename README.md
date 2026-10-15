# VTOP Plus

Unofficial quality-of-life improvements for VIT Vellore's VTOP student portal (`vtop.vit.ac.in`) in Firefox and Firefox-based browsers such as Zen. A Firefox (Manifest V3) port of **ViBoot** 2.1.15 by ViTrendz.

> **Unofficial.** VTOP Plus is not affiliated with, endorsed by or supported by VIT (Vellore Institute of Technology) or ViTrendz. Use it at your own risk.

## Features

| Where | What it does |
|---|---|
| Login | Reads the image captcha and fills it in, again after ↻. It never clicks Login. |
| Every page | Quick-nav buttons in the header: Marks View, Attendance, Course Page, DA Upload |
| Attendance | A column showing how many classes you can skip, or must attend, to stay at 75% (labs count as half) |
| Marks | Totals for each course, plus the marks still needed in FAT (theory) or to reach 50 (labs) |
| DA Upload | An "Upcoming Dues" column with the days left for each course, and sortable columns |

Not included: Google Calendar sync, renamed downloads, VTOP Chennai.

## Install as a temporary add-on (Firefox Developer Edition or Zen)

Needs Firefox 142 or later, or a Zen build based on it.

1. Download or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and choose `src/manifest.json`.
4. Open VTOP. The add-on stays loaded until the browser closes.

## Run the tests

Needs Node.js (developed on Node 26). The tests use Node's built-in runner, so there is nothing to install.

```sh
npm test
```

## Permissions and privacy

- Host access to `vtop.vit.ac.in` only. No other permissions.
- No server, no analytics, no storage. Every request goes to VTOP, as the page itself, through one helper (`src/lib/vtop-request.js`) that allows a fixed, read-only list of endpoints.
- The captcha is solved on your device by a small neural network bundled with the extension.

## Licence

My own code is under the MIT licence (`LICENSE`). Parts derived from ViBoot, including the captcha model, belong to ViTrendz and are **not** covered by it. See `NOTICE`.
