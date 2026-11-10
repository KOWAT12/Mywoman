// Progress: consistency, weekly training volume by movement, and a trend
// line for any exercise she has logged.

import { PATTERNS } from '../data/exercises.js';
import { fmtDate, h, icon } from '../dom.js';
import { getExercise } from '../logic/library.js';
import {
  allTimeBests,
  compact,
  exerciseHistory,
  finishedWorkouts,
  fmtWeight,
  setsByPattern,
  summarizeSets,
  weekStart,
  weekStreak,
  weeklyCounts,
  workoutTotals,
  workoutsInWeek,
} from '../logic/stats.js';
import { getState } from '../store.js';
import { columnChart, lineChart } from '../ui/charts.js';

const METRIC = {
  e1rm: { title: 'Estimated one-rep max', format: (v, unit) => `${fmtWeight(Math.round(v))} ${unit}` },
  reps: { title: 'Best set, reps', format: (v) => `${v} reps` },
  time: { title: 'Longest hold', format: (v) => `${v} s` },
};

// Exercises with history, most-logged first.
function loggedExercises(state) {
  const counts = new Map();
  for (const w of finishedWorkouts(state)) {
    for (const entry of w.entries) counts.set(entry.exerciseId, (counts.get(entry.exerciseId) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => getExercise(state, id))
    .filter((ex) => !ex.missing && exerciseHistory(state, ex.id).length);
}

function exerciseSection(state, exercises, selectedId) {
  const unit = state.settings.unit;
  const ex = exercises.find((e) => e.id === selectedId) || exercises[0];
  const history = exerciseHistory(state, ex.id);
  const bests = allTimeBests(state, ex.id);

  // Chart the metric the most recent session used, so the line never mixes
  // estimated maxes with rep counts.
  const kind = history[0].metric.kind;
  const meta = METRIC[kind];
  const points = history
    .filter((s) => s.metric && s.metric.kind === kind)
    .map((s) => ({ t: new Date(s.date), value: Math.round(s.metric.value * 10) / 10, label: fmtDate(s.date, { month: 'short', day: 'numeric', year: 'numeric' }) }))
    .reverse();
  const first = points[0];
  const last = points[points.length - 1];
  const change = last.value - first.value;

  return h(
    'div',
    { class: 'stack' },
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'ex-select', class: 'sr-only' }, 'Exercise'),
      h(
        'select',
        {
          id: 'ex-select',
          class: 'select',
          onchange: (e) => {
            location.hash = `#/progress/${e.target.value}`;
          },
        },
        exercises.map((e) => h('option', { value: e.id, selected: e.id === ex.id }, e.name)),
      ),
    ),
    h(
      'div',
      { class: 'card flat stack' },
      h(
        'div',
        {},
        h('div', { class: 'eyebrow' }, PATTERNS[ex.pattern] ? PATTERNS[ex.pattern].name : ''),
        h('div', { class: 'card-title' }, meta.title),
        h(
          'div',
          { class: 'small muted' },
          points.length > 1
            ? `${change >= 0 ? 'Up' : 'Down'} ${meta.format(Math.abs(Math.round(change * 10) / 10), unit)} across ${points.length} sessions`
            : 'One session logged. The trend appears after the next one.',
        ),
      ),
      lineChart({
        points,
        format: (v) => meta.format(v, unit),
        summary: `${meta.title} for ${ex.name}: ${meta.format(first.value, unit)} to ${meta.format(last.value, unit)} over ${points.length} sessions.`,
      }),
    ),
    h(
      'div',
      { class: 'tiles three' },
      h(
        'div',
        { class: 'tile' },
        h('div', { class: 'tile-label' }, 'Sessions'),
        h('div', { class: 'tile-value' }, String(bests.sessions)),
      ),
      bests.weight > 0
        ? h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Heaviest'), h('div', { class: 'tile-value' }, fmtWeight(bests.weight), h('small', {}, unit)))
        : h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, ex.timed ? 'Longest' : 'Most reps'), h('div', { class: 'tile-value' }, String(ex.timed ? bests.time : bests.reps), h('small', {}, ex.timed ? 's' : ''))),
      bests.e1rm > 0
        ? h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Est. max'), h('div', { class: 'tile-value' }, fmtWeight(Math.round(bests.e1rm)), h('small', {}, unit)))
        : h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Last done'), h('div', { class: 'tile-value', style: { fontSize: '18px', lineHeight: '1.6' } }, fmtDate(history[0].date, { month: 'short', day: 'numeric' }))),
    ),
    h(
      'div',
      { class: 'card flat' },
      h('div', { class: 'eyebrow' }, 'Recent sessions'),
      h(
        'table',
        { class: 'sets-table', style: { marginTop: '6px' } },
        h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Sets'), h('th', {}, 'RPE'))),
        h(
          'tbody',
          {},
          history.slice(0, 8).map((s) => {
            const rpes = s.sets.filter((x) => x.rpe).map((x) => x.rpe);
            return h(
              'tr',
              {},
              h('td', {}, h('a', { href: `#/history/${s.workoutId}`, style: { color: 'inherit' } }, fmtDate(s.date, { month: 'short', day: 'numeric' }))),
              h('td', {}, summarizeSets(s.sets, ex, unit)),
              h('td', {}, rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '–'),
            );
          }),
        ),
      ),
    ),
  );
}

export function renderProgress({ params }) {
  const state = getState();
  const unit = state.settings.unit;
  const all = finishedWorkouts(state);

  if (!all.length) {
    return h(
      'div',
      { class: 'view' },
      h('h1', { class: 'page-title' }, 'Progress'),
      h(
        'div',
        { class: 'empty' },
        h('h3', {}, 'Your numbers will live here'),
        h('p', {}, 'Log a session and Clave starts charting strength, volume and consistency.'),
      ),
    );
  }

  const thisWeek = workoutsInWeek(state, weekStart(new Date()));
  const totalVolume = all.reduce((sum, w) => sum + workoutTotals(w, unit).volume, 0);
  const streak = weekStreak(state);
  const weeks = weeklyCounts(state, 8);
  const tickFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  const patternSets = Object.entries(setsByPattern(state, weekStart(new Date())))
    .map(([id, sets]) => ({ id, sets, name: PATTERNS[id] ? PATTERNS[id].name : id }))
    .sort((a, b) => b.sets - a.sets);
  const maxSets = Math.max(1, ...patternSets.map((p) => p.sets));
  const exercises = loggedExercises(state);

  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'page-title' }, 'Progress'),
    h(
      'div',
      { class: 'tiles' },
      h(
        'div',
        { class: 'tile' },
        h('div', { class: 'tile-label' }, 'This week'),
        h('div', { class: 'tile-value' }, String(thisWeek.length), h('small', {}, `of ${state.settings.weeklyGoal}`)),
      ),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Week streak'), h('div', { class: 'tile-value' }, String(streak), h('small', {}, streak === 1 ? 'week' : 'weeks'))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Sessions logged'), h('div', { class: 'tile-value' }, String(all.length))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Total volume'), h('div', { class: 'tile-value' }, compact(totalVolume), h('small', {}, unit))),
    ),

    h(
      'div',
      { class: 'card flat stack' },
      h('div', {}, h('div', { class: 'card-title' }, 'Sessions per week'), h('div', { class: 'small muted' }, 'Last eight weeks')),
      columnChart({
        items: weeks.map((w) => ({ label: tickFmt.format(w.start), value: w.count, tip: `Week of ${tickFmt.format(w.start)}` })),
        unit: 'sessions',
        floor: state.settings.weeklyGoal,
        summary: `Sessions per week over the last eight weeks: ${weeks.map((w) => w.count).join(', ')}.`,
      }),
    ),

    h(
      'div',
      { class: 'card flat stack' },
      h('div', {}, h('div', { class: 'card-title' }, 'Sets by movement'), h('div', { class: 'small muted' }, 'Working sets logged this week')),
      patternSets.length
        ? h(
            'div',
            { class: 'hbar-list' },
            patternSets.map((p) =>
              h(
                'div',
                { class: 'hbar' },
                h('span', { class: 'hbar-name' }, p.name),
                h('span', { class: 'hbar-track' }, h('span', { class: 'hbar-fill', style: { width: `${(p.sets / maxSets) * 100}%` } })),
                h('span', { class: 'hbar-value' }, String(p.sets)),
              ),
            ),
          )
        : h('p', { class: 'small muted' }, 'No sets logged yet this week.'),
    ),

    h('div', { class: 'section-head' }, h('div', { class: 'section-title' }, 'By exercise'), h('span', { class: 'small muted row' }, icon('progress', 14), 'Trend')),
    exercises.length ? exerciseSection(state, exercises, params[0]) : null,
  );
}
