// Past sessions: a list by month, and a detail page per session.

import { PATTERNS } from '../data/exercises.js';
import { confirmSheet, fmtDate, fmtDuration, h, icon, toast } from '../dom.js';
import { getExercise } from '../logic/library.js';
import { compact, convert, finishedWorkouts, fmtWeight, num, workoutPRs, workoutTotals } from '../logic/stats.js';
import { deleteWorkout, editWorkout, getState } from '../store.js';

const PAGE = 30;
let shown = PAGE;

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function renderHistory() {
  const state = getState();
  const all = finishedWorkouts(state);
  const unit = state.settings.unit;

  if (!all.length) {
    return h(
      'div',
      { class: 'view' },
      h('h1', { class: 'page-title' }, 'History'),
      h(
        'div',
        { class: 'empty' },
        h('h3', {}, 'Nothing here yet'),
        h('p', {}, 'Finished sessions show up here, with every set you logged.'),
      ),
    );
  }

  const visible = all.slice(0, shown);
  const groups = [];
  for (const w of visible) {
    const key = fmtDate(w.startedAt, { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(w);
    else groups.push({ key, items: [w] });
  }

  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'page-title' }, 'History'),
    groups.map((group) => [
      h('div', { class: 'section-title' }, group.key),
      h(
        'div',
        { class: 'list' },
        group.items.map((w) => {
          const totals = workoutTotals(w, unit);
          const prs = workoutPRs(state, w);
          return h(
            'a',
            { class: 'list-item', href: `#/history/${w.id}` },
            h('span', { class: `badge ${w.region || ''}` }, initials(w.dayName)),
            h(
              'span',
              { class: 'grow' },
              h('div', { class: 'li-title' }, w.dayName),
              h('div', { class: 'li-sub' }, `${fmtDate(w.startedAt)} · ${fmtDuration(totals.minutes)} · ${totals.sets} sets`),
            ),
            prs.length ? h('span', { class: 'chip tiny gold' }, icon('star', 12), `${prs.length} PR${prs.length > 1 ? 's' : ''}`) : null,
            icon('right', 18),
          );
        }),
      ),
    ]),
    all.length > shown
      ? h(
          'button',
          {
            class: 'btn btn-ghost btn-block',
            onclick: () => {
              shown += PAGE;
              window.dispatchEvent(new Event('clave:render'));
            },
          },
          'Show earlier sessions',
        )
      : null,
  );
}

export function renderWorkoutDetail({ params }) {
  const state = getState();
  const unit = state.settings.unit;
  const w = state.workouts.find((x) => x.id === params[0]);

  if (!w) {
    return h(
      'div',
      { class: 'view' },
      h('a', { class: 'back-link', href: '#/history' }, icon('left', 20), 'History'),
      h('div', { class: 'empty' }, h('h3', {}, 'Session not found'), h('p', {}, 'It may have been deleted.')),
    );
  }

  const totals = workoutTotals(w, unit);
  const prs = workoutPRs(state, w);

  return h(
    'div',
    { class: 'view' },
    h('a', { class: 'back-link', href: '#/history' }, icon('left', 20), 'History'),
    h(
      'div',
      {},
      h('div', { class: 'eyebrow' }, fmtDate(w.startedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })),
      h('h1', { class: 'page-title' }, w.dayName),
      w.focus ? h('div', { class: 'muted' }, w.focus) : null,
    ),
    h(
      'div',
      { class: 'tiles' },
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Duration'), h('div', { class: 'tile-value' }, fmtDuration(totals.minutes))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Working sets'), h('div', { class: 'tile-value' }, String(totals.sets))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Volume'), h('div', { class: 'tile-value' }, compact(totals.volume), h('small', {}, unit))),
      h(
        'div',
        { class: 'tile' },
        h('div', { class: 'tile-label' }, 'Average RPE'),
        h('div', { class: 'tile-value' }, totals.avgRpe ? totals.avgRpe.toFixed(1) : '–'),
      ),
    ),

    prs.length
      ? h(
          'div',
          { class: 'card flat stack-sm' },
          h('div', { class: 'row' }, h('span', { style: { color: 'var(--gold)' } }, icon('star', 18)), h('div', { class: 'eyebrow' }, 'Personal records')),
          prs.map((pr) =>
            h(
              'div',
              { class: 'row between' },
              h('div', {}, h('div', { class: 'li-title' }, pr.name), h('div', { class: 'li-sub' }, pr.detail)),
              h('span', { class: 'chip gold' }, pr.label),
            ),
          ),
        )
      : null,

    w.notes ? h('div', { class: 'card flat' }, h('div', { class: 'eyebrow' }, 'Notes'), h('p', { style: { marginTop: '4px', whiteSpace: 'pre-wrap' } }, w.notes)) : null,

    w.entries.map((entry) => {
      const ex = getExercise(state, entry.exerciseId);
      const pattern = PATTERNS[entry.pattern];
      let n = 0;
      return h(
        'div',
        { class: 'card flat' },
        h('div', { class: 'chips' }, h('span', { class: 'chip tiny' }, pattern ? pattern.name : 'Movement')),
        h(
          'a',
          { href: `#/progress/${ex.id}`, style: { color: 'inherit', textDecoration: 'none' } },
          h('h2', { class: 'ex-name' }, ex.name),
        ),
        h(
          'table',
          { class: 'sets-table', style: { marginTop: '8px' } },
          h('thead', {}, h('tr', {}, h('th', {}, 'Set'), h('th', {}, ex.bw ? `Added ${unit}` : unit), h('th', {}, ex.timed ? 'Sec' : 'Reps'), h('th', {}, 'RPE'))),
          h(
            'tbody',
            {},
            entry.sets.map((set) => {
              if (!set.warmup) n += 1;
              const weight = convert(set.weight, w.unit || unit, unit);
              return h(
                'tr',
                {},
                h('td', {}, set.warmup ? 'Warm-up' : String(n)),
                h('td', {}, weight ? fmtWeight(weight) : ex.bw ? 'BW' : '–'),
                h('td', {}, String(num(set.reps))),
                h('td', {}, set.rpe ? String(set.rpe) : '–'),
              );
            }),
          ),
        ),
        entry.note ? h('p', { class: 'small muted', style: { marginTop: '8px', whiteSpace: 'pre-wrap' } }, entry.note) : null,
      );
    }),

    h(
      'div',
      { class: 'btn-row' },
      h(
        'button',
        {
          class: 'btn btn-ghost',
          onclick: () => {
            if (state.active) {
              toast('Finish the workout in progress first');
              return;
            }
            editWorkout(w.id);
            location.hash = '#/workout';
          },
        },
        icon('edit', 18),
        'Edit',
      ),
      h(
        'button',
        {
          class: 'btn btn-ghost',
          style: { color: 'var(--danger)' },
          onclick: () =>
            confirmSheet({
              title: 'Delete this session?',
              message: 'Its sets will be removed from your history and charts. This cannot be undone.',
              confirmLabel: 'Delete',
              danger: true,
            }).then((yes) => {
              if (!yes) return;
              deleteWorkout(w.id);
              location.hash = '#/history';
              toast('Session deleted');
            }),
        },
        icon('trash', 18),
        'Delete',
      ),
    ),
  );
}
