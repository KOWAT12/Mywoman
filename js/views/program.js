// Program editor: change variations, sets, reps and effort for each day.

import { PATTERNS } from '../data/exercises.js';
import { DEFAULT_TARGET } from '../data/program.js';
import { confirmSheet, h, icon, openSheet, toast } from '../dom.js';
import { exercisesForPattern, getExercise, isAvailable } from '../logic/library.js';
import { rankVariations, targetFor } from '../logic/recommend.js';
import { getState, rebuildProgram, uid, update } from '../store.js';
import { pickPattern, pickVariation } from '../ui/pickers.js';
import { targetLabel } from './today.js';

function stepperRow(label, value, onChange, { min, max, step = 1, format = String }) {
  const out = h('output', {}, format(value));
  let current = value;
  const set = (v) => {
    current = Math.max(min, Math.min(max, v));
    out.textContent = format(current);
    onChange(current);
  };
  return h(
    'div',
    { class: 'setting', style: { padding: '8px 0' } },
    h('div', { class: 'setting-title' }, label),
    h(
      'div',
      { class: 'stepper', role: 'group', 'aria-label': label },
      h('button', { 'aria-label': `Decrease ${label}`, onclick: () => set(current - step) }, icon('minus', 18)),
      out,
      h('button', { 'aria-label': `Increase ${label}`, onclick: () => set(current + step) }, icon('plus', 18)),
    ),
  );
}

function editSlot(day, slot) {
  const state = getState();
  const ex = getExercise(state, slot.exerciseId);
  const index = day.slots.indexOf(slot);
  let sheet;

  const move = (delta) => {
    update(() => {
      const to = index + delta;
      if (to < 0 || to >= day.slots.length) return;
      day.slots.splice(index, 1);
      day.slots.splice(to, 0, slot);
    });
    sheet.close();
  };

  sheet = openSheet({
    title: ex.name,
    subtitle: `${day.name} · ${PATTERNS[slot.pattern].name}`,
    body: h(
      'div',
      { class: 'stack' },
      h(
        'button',
        {
          class: 'btn btn-ghost btn-block',
          onclick: () => {
            sheet.close();
            pickVariation({
              state,
              pattern: slot.pattern,
              currentId: slot.exerciseId,
              dayId: day.id,
              target: targetFor(slot, ex),
              onPick: (picked) => {
                update(() => (slot.exerciseId = picked.id));
                toast(`${picked.name} is in`);
              },
            });
          },
        },
        icon('swap', 18),
        'Change variation',
      ),
      h(
        'div',
        {},
        stepperRow('Sets', slot.sets, (v) => update(() => (slot.sets = v), { render: false }), { min: 1, max: 8 }),
        ex.timed
          ? h('p', { class: 'small muted', style: { padding: '8px 0' } }, 'Timed holds use their own range in seconds.')
          : [
              stepperRow('Reps, low end', slot.reps[0], (v) => update(() => {
                slot.reps[0] = v;
                if (slot.reps[1] < v) slot.reps[1] = v;
              }, { render: false }), { min: 1, max: 30 }),
              stepperRow('Reps, high end', slot.reps[1], (v) => update(() => {
                slot.reps[1] = v;
                if (slot.reps[0] > v) slot.reps[0] = v;
              }, { render: false }), { min: 1, max: 30 }),
            ],
        stepperRow('Target RPE', slot.rpe, (v) => update(() => (slot.rpe = v), { render: false }), { min: 5, max: 10, step: 0.5 }),
      ),
      h(
        'div',
        { class: 'btn-row' },
        h('button', { class: 'btn btn-ghost', disabled: index === 0, onclick: () => move(-1) }, icon('up', 18), 'Move up'),
        h('button', { class: 'btn btn-ghost', disabled: index === day.slots.length - 1, onclick: () => move(1) }, icon('down', 18), 'Move down'),
      ),
      h(
        'button',
        {
          class: 'btn-text',
          style: { color: 'var(--danger)', alignSelf: 'center' },
          onclick: () => {
            update(() => day.slots.splice(index, 1));
            sheet.close();
          },
        },
        `Remove from ${day.name}`,
      ),
    ),
    onClose: () => window.dispatchEvent(new Event('clave:render')),
  });
}

function addSlot(day) {
  const state = getState();
  pickPattern({
    title: `Add to ${day.name}`,
    onPick: (pattern) => {
      const ranked = rankVariations(state, { pattern, dayId: day.id, target: DEFAULT_TARGET });
      const fallback = exercisesForPattern(state, pattern).find((ex) => isAvailable(ex, state.settings));
      const first = ranked.recommended[0] ? ranked.recommended[0].ex : fallback;
      if (!first) return;
      pickVariation({
        state,
        pattern,
        dayId: day.id,
        target: DEFAULT_TARGET,
        title: `Add: ${PATTERNS[pattern].name}`,
        onPick: (ex) => {
          update(() =>
            day.slots.push({
              id: `${day.id}-${uid()}`,
              pattern,
              sets: DEFAULT_TARGET.sets,
              reps: [...DEFAULT_TARGET.reps],
              rpe: DEFAULT_TARGET.rpe,
              exerciseId: ex.id,
            }),
          );
          toast(`${ex.name} added to ${day.name}`);
        },
      });
    },
  });
}

export function renderProgram() {
  const state = getState();
  return h(
    'div',
    { class: 'view' },
    h('a', { class: 'back-link', href: '#/today' }, icon('left', 20), 'Today'),
    h(
      'div',
      {},
      h('h1', { class: 'page-title' }, 'Your split'),
      h('p', { class: 'muted' }, 'Four days, alternating upper and lower. Tap a movement to change its variation, sets, reps or target effort.'),
    ),
    state.program.map((day) =>
      h(
        'div',
        { class: 'card flat' },
        h('div', { class: 'eyebrow' }, day.focus),
        h('div', { class: 'card-title' }, day.name),
        h(
          'div',
          { class: 'plan-list', style: { marginTop: '4px' } },
          day.slots.map((slot, i) => {
            const ex = getExercise(state, slot.exerciseId);
            const target = targetFor(slot, ex);
            return h(
              'button',
              { class: 'plan-item', onclick: () => editSlot(day, slot) },
              h('span', { class: 'plan-num' }, String(i + 1)),
              h(
                'span',
                { class: 'grow' },
                h('div', { class: 'plan-name' }, ex.name),
                h('div', { class: 'plan-sub' }, `${PATTERNS[slot.pattern].name} · ${targetLabel(target, ex)} · RPE ${target.rpe}`),
              ),
              icon('right', 18),
            );
          }),
        ),
        h('button', { class: 'btn-text', onclick: () => addSlot(day) }, '+ Add a movement'),
      ),
    ),
    h(
      'button',
      {
        class: 'btn btn-ghost btn-block',
        onclick: () =>
          confirmSheet({
            title: 'Rebuild the recommended split?',
            message: 'Clave will pick variations again from your current equipment and experience. Your edits to this plan will be replaced. Logged sessions are not affected.',
            confirmLabel: 'Rebuild',
          }).then((yes) => {
            if (!yes) return;
            rebuildProgram();
            toast('Program rebuilt');
          }),
      },
      'Rebuild recommended split',
    ),
  );
}
