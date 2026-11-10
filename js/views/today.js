// Home: this week, the next session in the split, and variation suggestions.

import { PATTERNS } from '../data/exercises.js';
import { fmtDate, fmtDuration, h, icon, relativeDay, toast } from '../dom.js';
import { getExercise } from '../logic/library.js';
import { dayInsights, INSIGHT_TITLE, nextDayId, targetFor } from '../logic/recommend.js';
import { addDays, finishedWorkouts, weekStart, weekStreak, workoutsInWeek, workoutTotals } from '../logic/stats.js';
import { getState, setSlotExercise, startWorkout } from '../store.js';
import { pickVariation } from '../ui/pickers.js';

let selectedDayId = null;

export function wordmark() {
  return h(
    'div',
    { class: 'wordmark' },
    'Clave',
    // Five dots in a 3-2 grouping: the son clave.
    h('span', { class: 'beats', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i', { class: 'gap' }), h('i')),
  );
}

export function targetLabel(target, ex) {
  const [lo, hi] = target.reps;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  const unit = ex.timed ? ' sec' : ex.uni ? ' per side' : '';
  return `${target.sets} × ${range}${unit}`;
}

function estimateMinutes(state, day) {
  let seconds = 5 * 60;
  for (const slot of day.slots) {
    const core = PATTERNS[slot.pattern].tier === 'core';
    seconds += slot.sets * ((core ? state.settings.restMain : state.settings.restAccessory) + 45);
  }
  return Math.round(seconds / 300) * 5;
}

function greeting(name) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

function weekStrip(state) {
  const start = weekStart(new Date());
  const done = workoutsInWeek(state, start);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const goal = state.settings.weeklyGoal;

  return h(
    'div',
    { class: 'card flat stack' },
    h(
      'div',
      { class: 'row between' },
      h('div', { class: 'eyebrow' }, 'This week'),
      h('div', { class: 'small muted' }, `${done.length} of ${goal} sessions`),
    ),
    h(
      'div',
      { class: 'week' },
      letters.map((letter, i) => {
        const date = addDays(start, i);
        const hit = done.find((w) => {
          const d = new Date(w.startedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === date.getTime();
        });
        const isToday = date.getTime() === today.getTime();
        return h(
          'div',
          {
            class: `week-day ${hit ? 'done' : ''} ${isToday ? 'today' : ''}`,
            role: 'img',
            'aria-label': `${names[i]}: ${hit ? hit.dayName : 'no session'}`,
          },
          h('span', {}, letter),
          h('span', { class: 'week-dot' }, hit ? icon('check', 16) : String(date.getDate())),
        );
      }),
    ),
  );
}

function insightCard(state, day, insight) {
  const openOptions = () =>
    pickVariation({
      state,
      pattern: insight.current.pattern,
      currentId: insight.current.id,
      dayId: day.id,
      target: targetFor(day.slots.find((s) => s.id === insight.slotId), insight.current),
      intent: insight.type,
      onPick: (ex) => {
        setSlotExercise(insight.slotId, ex.id);
        toast(`${ex.name} is in`);
      },
    });

  return h(
    'div',
    { class: 'insight' },
    icon(insight.type === 'unavailable' ? 'alert' : 'spark', 20),
    h(
      'div',
      { class: 'grow' },
      h('div', { class: 'insight-title' }, `${INSIGHT_TITLE[insight.type]}: ${insight.current.name}`),
      h(
        'div',
        { class: 'insight-body' },
        `${insight.text} Try ${insight.suggestion.name}${insight.suggestion.dance ? `. ${insight.suggestion.dance}` : '.'}`,
      ),
      h(
        'div',
        { class: 'row wrap' },
        h(
          'button',
          {
            class: 'btn btn-sm btn-primary',
            onclick: () => {
              setSlotExercise(insight.slotId, insight.suggestion.id);
              toast(`${insight.suggestion.name} is in`);
            },
          },
          'Swap it in',
        ),
        h('button', { class: 'btn btn-sm btn-ghost', onclick: openOptions }, 'Other options'),
      ),
    ),
  );
}

export function renderToday() {
  const state = getState();
  const { program, active, settings } = state;
  const upNextId = nextDayId(state);
  if (!program.some((d) => d.id === selectedDayId)) selectedDayId = null;
  const day = program.find((d) => d.id === (selectedDayId || upNextId)) || program[0];
  const isNext = day.id === upNextId;
  const insights = dayInsights(state, day).slice(0, 2);
  const last = finishedWorkouts(state)[0];
  const streak = weekStreak(state);

  const hero = active
    ? h(
        'div',
        { class: 'hero' },
        h('div', { class: 'eyebrow' }, active.editingId ? 'Editing' : 'In progress'),
        h('div', { class: 'hero-title' }, active.dayName),
        h('div', { class: 'hero-meta' }, active.editingId ? fmtDate(active.startedAt) : `Started ${fmtDate(active.startedAt, { hour: 'numeric', minute: '2-digit' })}`),
        h('a', { class: 'btn btn-block', href: '#/workout' }, icon('play', 18), active.editingId ? 'Continue editing' : 'Resume workout'),
      )
    : h(
        'div',
        { class: 'hero' },
        h('div', { class: 'eyebrow' }, isNext ? 'Next up' : 'Selected'),
        h('div', { class: 'hero-title' }, day.name),
        h('div', { class: 'hero-meta' }, `${day.focus} · ${day.slots.length} movements · about ${fmtDuration(estimateMinutes(state, day))}`),
        h(
          'button',
          {
            class: 'btn btn-block',
            onclick: () => {
              startWorkout(day.id);
              selectedDayId = null;
              location.hash = '#/workout';
            },
          },
          icon('play', 18),
          'Start workout',
        ),
      );

  return h(
    'div',
    { class: 'view' },
    h(
      'header',
      { class: 'topbar' },
      wordmark(),
      h('a', { class: 'icon-btn', href: '#/settings', 'aria-label': 'Settings' }, icon('settings', 22)),
    ),
    h(
      'div',
      {},
      h('div', { class: 'eyebrow' }, fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })),
      h('h1', { class: 'page-title' }, greeting(settings.name)),
    ),
    hero,
    weekStrip(state),

    h(
      'div',
      { class: 'choice-row', role: 'group', 'aria-label': 'Choose a session' },
      program.map((d) =>
        h(
          'button',
          {
            class: 'choice',
            'aria-pressed': String(d.id === day.id),
            onclick: () => {
              selectedDayId = d.id;
              window.dispatchEvent(new Event('clave:render'));
            },
          },
          d.name,
        ),
      ),
    ),

    insights.map((insight) => insightCard(state, day, insight)),

    h(
      'div',
      { class: 'card flat' },
      h(
        'div',
        { class: 'row between', style: { marginBottom: '4px' } },
        h('div', {}, h('div', { class: 'eyebrow' }, day.focus), h('div', { class: 'card-title' }, `${day.name} plan`)),
        h('a', { class: 'btn-text', href: '#/program' }, 'Edit'),
      ),
      h(
        'div',
        { class: 'plan-list' },
        day.slots.map((slot, i) => {
          const ex = getExercise(state, slot.exerciseId);
          const target = targetFor(slot, ex);
          return h(
            'button',
            {
              class: 'plan-item',
              'aria-label': `${ex.name}. Change variation`,
              onclick: () =>
                pickVariation({
                  state,
                  pattern: slot.pattern,
                  currentId: slot.exerciseId,
                  dayId: day.id,
                  target,
                  onPick: (picked) => {
                    setSlotExercise(slot.id, picked.id);
                    toast(`${picked.name} is in`);
                  },
                }),
            },
            h('span', { class: 'plan-num' }, String(i + 1)),
            h(
              'span',
              { class: 'grow' },
              h('div', { class: 'plan-name' }, ex.name),
              h('div', { class: 'plan-sub' }, `${PATTERNS[slot.pattern].name} · ${targetLabel(target, ex)} · RPE ${target.rpe}`),
            ),
            icon('swap', 18),
          );
        }),
      ),
      h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'Tap any movement to see recommended variations.'),
    ),

    last
      ? h(
          'div',
          { class: 'tiles' },
          h(
            'a',
            { class: 'tile', href: `#/history/${last.id}`, style: { textDecoration: 'none', color: 'inherit' } },
            h('div', { class: 'tile-label' }, 'Last session'),
            h('div', { class: 'tile-value' }, last.dayName),
            h('div', { class: 'tile-note' }, `${relativeDay(last.startedAt)} · ${workoutTotals(last, settings.unit).sets} sets`),
          ),
          h(
            'div',
            { class: 'tile' },
            h('div', { class: 'tile-label' }, 'Week streak'),
            h('div', { class: 'tile-value' }, String(streak), h('small', {}, streak === 1 ? 'week' : 'weeks')),
            h('div', { class: 'tile-note' }, 'Weeks in a row with a session'),
          ),
        )
      : h(
          'p',
          { class: 'small muted', style: { textAlign: 'center' } },
          'Your first session sets the baseline. Clave builds on it from there.',
        ),
  );
}
