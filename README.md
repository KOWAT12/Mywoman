# Clave

A strength tracker built for a dancer. Four days a week, alternating upper and
lower body, built on seven core movements. Clave picks a variation of each
movement, logs every set (weight, reps, RPE), tells her what to aim for next
time, and suggests a new variation when the current one stops paying off.

It is a web app that installs to a phone's home screen and works offline.
There is no account and no server: everything she logs stays on her phone.

## What it does

**Upper / lower split.** Upper A, Lower A, Upper B, Lower B, in rotation. The
A and B days train the same movement patterns with different variations and
rep ranges, so each core movement is trained twice a week.

**Core movements and their variations.** The split is built on seven patterns:
squat, hinge, single-leg, horizontal push, vertical push, horizontal pull and
vertical pull. Accessories (glutes, hamstrings, hips, calves, shoulders, arms)
and trunk work (stability and rotation) fill in around them. The library holds
about 150 variations, each with a coaching cue. More than thirty carry a note
on how they transfer to the dance floor.

**Recommendations.** Tap any movement to see its variations, ranked for her:
what fits her equipment and experience, what she has not done lately, what she
has marked as a favorite, and what carries over to dancing. Clave also speaks
up on its own when a change is due:

| It notices | It suggests |
| --- | --- |
| No progress across three sessions | A different variation of the same movement |
| Every set at the top of the range on a bodyweight move | A harder or loaded variation |
| Two hard sessions without reaching the rep range | An easier build-up |
| A long run on one variation and progress has slowed | A fresh one |
| A movement needs equipment she no longer has | A replacement she can do |

**Logging.** Each set records weight, reps (or seconds for holds) and RPE.
Sets can be marked as warm-ups. Each movement and each session can carry
notes. A rest timer starts when a set is checked off.

**Progression.** Each movement shows what she did last time and what to aim
for today. It uses double progression with RPE as the brake: fill the rep
range at a weight, and when the effort was on target, add load.

**Progress.** Personal records, an estimated one-rep-max trend for every
exercise, sessions per week, and working sets per movement this week.

## Put it on her phone

The app is plain files with no build step, so any static host works.

### GitHub Pages

1. In this repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick the
   branch that holds these files, and the `/ (root)` folder. Save.
3. After a minute the page shows the address, in the form
   `https://<user>.github.io/<repository>/`.

GitHub Pages is free for public repositories. For a private repository it
needs a paid GitHub plan. Netlify, Vercel and Cloudflare Pages all host a
folder of static files for free and work the same way.

### Install it

Open the address on her phone, then:

- **iPhone:** in Safari, tap Share, then **Add to Home Screen**.
- **Android:** in Chrome, open the menu, then **Add to Home screen** (or
  **Install app**).

Install it before logging anything. On an iPhone the installed app keeps its
own storage, separate from Safari, and Safari may clear the data of a site
that is only used in a browser tab.

### Her data

Sessions are stored on the phone and nowhere else. **Settings → Back up**
downloads everything as one file, and **Restore** loads it again. Use that
when changing phones, and now and then for safekeeping.

## Run it locally

```sh
npm start        # serves the folder at http://localhost:5173
npm test         # unit tests for the recommendation and progression logic
```

`npm start` only needs Python 3. Any static file server will do. Opening
`index.html` straight from disk will not work, because browsers block
JavaScript modules on `file://` addresses.

## Where things live

```
index.html              page shell
css/styles.css          all styling, light and dark themes
sw.js                   offline cache
manifest.webmanifest    home-screen install details
js/app.js               routing and the tab bar
js/store.js             saved state and every action that changes it
js/data/exercises.js    movement patterns and the exercise library
js/data/program.js      the upper/lower template and warm-ups
js/logic/recommend.js   program builder, variation ranking, change detection
js/logic/stats.js       estimated max, progression, records, weekly totals
js/views/               one file per screen
js/ui/                  rest timer, pickers, charts
tests/                  unit tests (Node's built-in runner, no dependencies)
```

## Make it hers

- **Exercises.** Add a line to `js/data/exercises.js`. She can also add her
  own variations inside the app, under Movements.
- **The split.** `js/data/program.js` holds the four days. Each slot names a
  movement pattern, sets, a rep range, a target RPE, and the order in which
  variations are preferred. She can edit sets, reps and variations in the app
  under Settings → Edit the split.
- **The name.** "Clave" is the five-beat rhythm salsa is built on. To rename
  the app, change it in `index.html`, `manifest.webmanifest`, and the
  `wordmark` function in `js/views/today.js`.
- **After changing files** on a live site, bump `VERSION` at the top of
  `sw.js` so phones drop the old offline copy.
