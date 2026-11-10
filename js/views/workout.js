// The live session: one card per movement, one row per set.

import { PATTERNS } from '../data/exercises.js';
import { WARMUPS } from '../data/program.js';
import { actionSheet, confirmSheet, fmtClock, fmtDate, h, icon, openSheet, relativeDay, toast } from '../dom.js';
import { getExercise } from '../logic/library.js';
import { INSIGHT_TITLE, slotInsight } from '../logic/recommend.js';
import { num, suggestNext, summarizeSets } from '../logic/stats.js';
import {
  addEntry,
  discardWorkout,
  findSlot,
  finishWorkout,
  getState,
  removeEntry,
  swapEntryExercise,
  update,
} from '../store.js';
import { pickPattern, pickRpe, pickVariation } from '../ui/pickers.js';
import { startRest, stopRest } from '../ui/timer.js';
import { targetLabel } from './today.js';

const openNotes = new Set();

function counts(active) {
  let done = 0;
  let total = 0;
  for (const entry of active.entries) {
    for (const set of entry.sets) {
      if (set.warmup) continue;
      total += 1;
      if (set.done) done += 1;
    }
  }
  return { done, total };
}

export function elapsedLabel(active) {
  return fmtClock((Date.now() - new Date(active.startedAt).getTime()) / 1000);
}

// What an empty row will be filled with when it is checked off: the previous
// set in this session, or else today's suggestion.
function hintFor(entry, index, suggestion) {
  const set = entry.sets[index];
  if (set.warmup) return { weight: null, reps: null };
  for (let j = index - 1; j >= 0; j -= 1) {
    const prev = entry.sets[j];
    if (prev.done && !prev.warmup) return { weight: num(prev.weight) || null, reps: num(prev.reps) || null };
  }
  return { weight: suggestion.weight || null, reps: suggestion.reps || null };
}

function setRow(state, entry, index, ctx) {
  const { ex, suggestion, editing } = ctx;
  const set = entry.sets[index];
  const hint = hintFor(entry, index, suggestion);
  const unit = state.active.unit;
  const [lo, hi] = entry.target.reps;
  const workNumber = entry.sets.slice(0, index + 1).filter((s) => !s.warmup).length;

  const repsInput = h('input', {
    class: 'set-input',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    'aria-label': `Set ${index + 1} ${ex.timed ? 'seconds' : 'reps'}`,
    placeholder: hint.reps ? String(hint.reps) : lo === hi ? String(lo) : `${lo}–${hi}`,
    value: set.reps === '' || set.reps == null ? '' : String(set.reps),
    onfocus: (e) => e.target.select(),
    oninput: (e) => {
      const clean = e.target.value.replace(/[^0-9]/g, '');
      if (clean !== e.target.value) e.target.value = clean;
      update(() => (set.reps = clean), { render: false });
    },
  });

  const row = h('div', { class: `set-row ${set.done ? 'done' : ''}` });

  const toggleDone = () => {
    if (set.done) {
      update(() => (set.done = false));
      return;
    }
    const weight = set.weight !== '' && set.weight != null ? set.weight : hint.weight || '';
    const reps = set.reps !== '' && set.reps != null ? set.reps : hint.reps || '';
    if (!num(reps)) {
      row.classList.remove('shake');
      requestAnimationFrame(() => row.classList.add('shake'));
      toast(ex.timed ? 'Enter the seconds first' : 'Enter the reps first');
      repsInput.focus();
      return;
    }
    update(() => {
      set.weight = weight;
      set.reps = reps;
      set.done = true;
    });
    if (editing || set.warmup) return;
    const core = PATTERNS[entry.pattern] && PATTERNS[entry.pattern].tier === 'core';
    startRest(core ? state.settings.restMain : state.settings.restAccessory);
    if (state.settings.askRpe && !set.rpe) {
      pickRpe({ onPick: (value) => update(() => (set.rpe = value)) });
    }
  };

  const setMenu = () =>
    actionSheet({
      title: set.warmup ? 'Warm-up set' : `Set ${workNumber}`,
      actions: [
        {
          icon: 'timer',
          label: set.warmup ? 'Count as a working set' : 'Mark as a warm-up set',
          run: () => update(() => (set.warmup = !set.warmup)),
        },
        entry.sets.length > 1
          ? { icon: 'trash', label: 'Delete this set', danger: true, run: () => update(() => entry.sets.splice(index, 1)) }
          : null,
      ],
    });

  row.append(
    h(
      'button',
      { class: `set-num ${set.warmup ? 'warm' : ''}`, 'aria-label': `Set ${index + 1} options`, onclick: setMenu },
      set.warmup ? 'W' : String(workNumber),
    ),
    h('input', {
      class: 'set-input',
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      'aria-label': `Set ${index + 1} weight in ${unit}`,
      placeholder: hint.weight ? String(hint.weight) : ex.bw ? 'BW' : unit,
      value: set.weight === '' || set.weight == null ? '' : String(set.weight),
      onfocus: (e) => e.target.select(),
      oninput: (e) => {
        const clean = e.target.value.replace(/[^0-9.,]/g, '');
        if (clean !== e.target.value) e.target.value = clean;
        update(() => (set.weight = clean), { render: false });
      },
    }),
    repsInput,
    h(
      'button',
      {
        class: `rpe-btn ${set.rpe ? 'set' : ''}`,
        'aria-label': set.rpe ? `Set ${index + 1} RPE ${set.rpe}. Change` : `Set ${index + 1} RPE`,
        onclick: () => pickRpe({ current: set.rpe, title: 'Rate the effort', onPick: (value) => update(() => (set.rpe = value)) }),
      },
      set.rpe ? String(set.rpe) : '–',
    ),
    h(
      'button',
      {
        class: 'set-check',
        'aria-label': set.done ? `Set ${index + 1} done. Undo` : `Complete set ${index + 1}`,
        'aria-pressed': String(Boolean(set.done)),
        onclick: toggleDone,
      },
      icon('check', 20),
    ),
  );
  return row;
}

function entryCard(state, entry) {
  const active = state.active;
  const editing = Boolean(active.editingId);
  const ex = getExercise(state, entry.exerciseId);
  const pattern = PATTERNS[entry.pattern] || { name: 'Movement', tier: 'accessory' };
  const suggestion = editing ? { weight: null, reps: null, last: null, text: '' } : suggestNext(state, ex, entry.target);
  const found = entry.slotId ? findSlot(state, entry.slotId) : null;
  const started = entry.sets.some((s) => s.done);
  const insight = !editing && !started && found ? slotInsight(state, found.slot, active.dayId) : null;
  const workSets = entry.sets.filter((s) => !s.warmup);
  const complete = workSets.length > 0 && workSets.every((s) => s.done);
  const ctx = { ex, suggestion, editing };

  const swap = (intent = null) =>
    pickVariation({
      state,
      pattern: entry.pattern,
      currentId: entry.exerciseId,
      dayId: active.dayId,
      target: entry.target,
      intent,
      onPick: (picked) => {
        swapEntryExercise(entry.id, picked.id);
        toast(`Swapped to ${picked.name}`);
      },
    });

  const showNote = openNotes.has(entry.id) || Boolean(entry.note);

  return h(
    'section',
    { class: `card ex-card ${complete ? 'complete' : ''}`, 'aria-label': ex.name },
    h(
      'div',
      { class: 'ex-head' },
      h(
        'div',
        { class: 'grow' },
        h(
          'div',
          { class: 'chips' },
          h('span', { class: `chip tiny ${pattern.tier === 'core' ? 'accent' : ''}` }, pattern.name),
          pattern.tier === 'core' ? h('span', { class: 'chip tiny' }, 'Core movement') : null,
          complete ? h('span', { class: 'chip tiny good' }, 'Done') : null,
        ),
        h('h2', { class: 'ex-name' }, ex.name),
        h('div', { class: 'ex-target' }, `Target ${targetLabel(entry.target, ex)} · RPE ${entry.target.rpe}`),
      ),
      h('button', { class: 'btn btn-sm btn-ghost', onclick: () => swap(), 'aria-label': `Swap ${ex.name} for another variation` }, icon('swap', 16), 'Swap'),
    ),

    ex.cue ? h('p', { class: 'ex-cue' }, ex.cue) : null,

    !editing
      ? h(
          'div',
          { class: 'coach' },
          h(
            'div',
            { class: 'grow' },
            suggestion.last
              ? h(
                  'div',
                  { class: 'line' },
                  h('div', { class: 'label' }, `Last time · ${relativeDay(suggestion.last.date)}`),
                  h('div', {}, summarizeSets(suggestion.last.sets, ex, state.settings.unit)),
                )
              : null,
            h('div', { class: 'line' }, h('div', { class: 'label' }, 'Today'), h('div', {}, suggestion.text)),
          ),
        )
      : null,

    insight
      ? h(
          'button',
          { class: 'nudge', onclick: () => swap(insight.type) },
          icon('spark', 18),
          h('span', { class: 'grow' }, h('strong', {}, `${INSIGHT_TITLE[insight.type]}. `), `${insight.text} Try ${insight.suggestion.name}.`),
          icon('right', 16),
        )
      : null,

    h(
      'div',
      { class: 'sets' },
      h(
        'div',
        { class: 'set-head', 'aria-hidden': 'true' },
        h('span', {}, 'Set'),
        h('span', {}, ex.bw ? `+ ${active.unit}` : active.unit),
        h('span', {}, ex.timed ? 'Sec' : 'Reps'),
        h('span', {}, 'RPE'),
        h('span', {}, ''),
      ),
      entry.sets.map((_, i) => setRow(state, entry, i, ctx)),
    ),

    showNote
      ? h('textarea', {
          class: 'note-input',
          rows: '2',
          placeholder: 'Notes for this movement',
          'aria-label': `Notes for ${ex.name}`,
          oninput: (e) => update(() => (entry.note = e.target.value), { render: false }),
        }, entry.note || '')
      : null,

    h(
      'div',
      { class: 'ex-foot' },
      h(
        'button',
        {
          class: 'btn-text',
          onclick: () =>
            update(() => entry.sets.push({ weight: '', reps: '', rpe: null, done: false, warmup: false })),
        },
        '+ Add set',
      ),
      !showNote
        ? h(
            'button',
            {
              class: 'btn-text',
              style: { color: 'var(--text-2)' },
              onclick: () => {
                openNotes.add(entry.id);
                window.dispatchEvent(new Event('clave:render'));
              },
            },
            'Add note',
          )
        : null,
      h('span', { class: 'grow' }),
      h(
        'button',
        {
          class: 'icon-btn',
          'aria-label': `More options for ${ex.name}`,
          onclick: () =>
            actionSheet({
              title: ex.name,
              actions: [
                { icon: 'swap', label: 'Swap variation', run: () => swap() },
                { icon: 'progress', label: 'See history', run: () => (location.hash = `#/progress/${ex.id}`) },
                {
                  icon: 'trash',
                  label: 'Remove from this session',
                  danger: true,
                  run: () => removeEntry(entry.id),
                },
              ],
            }),
        },
        icon('more', 20),
      ),
    ),
  );
}

function warmupCard(state) {
  const active = state.active;
  const items = WARMUPS[active.region] || WARMUPS.lower;
  const done = active.warmupDone || [];
  return h(
    'details',
    { class: 'card flat fold', open: done.length > 0 && done.length < items.length },
    h(
      'summary',
      {},
      h('div', {}, h('div', { class: 'eyebrow' }, 'Before you lift'), h('div', { style: { fontWeight: '620' } }, `Warm-up · ${done.length}/${items.length}`)),
      icon('down', 20),
    ),
    h(
      'div',
      { class: 'fold-body warmup-list' },
      items.map((item, i) =>
        h(
          'button',
          {
            class: 'check-row',
            'aria-pressed': String(done.includes(i)),
            onclick: () =>
              update((s) => {
                const list = s.active.warmupDone || (s.active.warmupDone = []);
                const at = list.indexOf(i);
                if (at >= 0) list.splice(at, 1);
                else list.push(i);
              }),
          },
          h('span', { class: 'check-box' }, icon('check', 14)),
          h('span', { class: 'grow check-name' }, item.name),
          h('span', { class: 'small muted' }, item.dose),
        ),
      ),
    ),
  );
}

function finishFlow(state) {
  const active = state.active;
  const { done, total } = counts(active);
  const anyDone = active.entries.some((e) => e.sets.some((s) => s.done));
  const editing = Boolean(active.editingId);

  if (!anyDone) {
    confirmSheet({
      title: 'Nothing logged yet',
      message: 'Check off at least one set to save this session, or discard it.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep going',
      danger: true,
    }).then((yes) => {
      if (!yes) return;
      stopRest();
      discardWorkout();
      location.hash = '#/today';
    });
    return;
  }

  const notes = h('textarea', { class: 'note-input', rows: '3', placeholder: 'How did it feel? Anything to remember?', 'aria-label': 'Session notes' }, active.notes || '');
  const left = total - done;
  const sheet = openSheet({
    title: editing ? 'Save changes?' : 'Finish workout?',
    subtitle: editing ? fmtDate(active.startedAt) : `${done} of ${total} sets done · ${elapsedLabel(active)}`,
    body: h(
      'div',
      { class: 'stack' },
      left > 0 ? h('p', { class: 'small muted' }, `${left} unchecked ${left === 1 ? 'set' : 'sets'} will be left out.`) : null,
      notes,
      h(
        'button',
        {
          class: 'btn btn-primary btn-block',
          onclick: () => {
            const id = finishWorkout(notes.value.trim());
            sheet.close();
            stopRest();
            openNotes.clear();
            if (id) {
              location.hash = `#/history/${id}`;
              toast(editing ? 'Changes saved' : 'Workout saved');
            }
          },
        },
        editing ? 'Save' : 'Finish and save',
      ),
    ),
  });
}

export function renderWorkout() {
  const state = getState();
  const active = state.active;

  if (!active) {
    return h(
      'div',
      { class: 'view no-tabs' },
      h(
        'div',
        { class: 'empty' },
        h('h3', {}, 'No workout in progress'),
        h('p', {}, 'Start one from the Today tab.'),
        h('a', { class: 'btn btn-primary', href: '#/today', style: { marginTop: '16px' } }, 'Go to Today'),
      ),
    );
  }

  const editing = Boolean(active.editingId);
  const { done, total } = counts(active);

  return h(
    'div',
    { class: 'view no-tabs' },
    h(
      'header',
      { class: 'workout-bar' },
      h('a', { class: 'icon-btn', href: '#/today', 'aria-label': 'Back to Today. The workout keeps running' }, icon('left', 22)),
      h(
        'div',
        { class: 'titles' },
        h('div', { class: 'name' }, editing ? `Editing ${active.dayName}` : active.dayName),
        h(
          'div',
          { class: 'sub' },
          editing ? fmtDate(active.startedAt) : [h('span', { id: 'elapsed' }, elapsedLabel(active)), ` · ${done}/${total} sets`],
        ),
      ),
      h('button', { class: 'btn btn-sm btn-primary', onclick: () => finishFlow(state) }, editing ? 'Save' : 'Finish'),
    ),
    h(
      'div',
      { class: 'progress-track', role: 'progressbar', 'aria-label': 'Sets completed', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done) },
      h('div', { class: 'progress-fill', style: { width: `${total ? (done / total) * 100 : 0}%` } }),
    ),

    !editing ? warmupCard(state) : null,
    active.entries.map((entry) => entryCard(state, entry)),

    h(
      'button',
      {
        class: 'btn btn-outline btn-block',
        onclick: () =>
          pickPattern({
            onPick: (pattern) =>
              pickVariation({
                state,
                pattern,
                dayId: active.dayId,
                title: `Add: ${PATTERNS[pattern].name}`,
                onPick: (ex) => {
                  addEntry(pattern, ex.id);
                  toast(`${ex.name} added`);
                },
              }),
          }),
      },
      icon('plus', 18),
      'Add a movement',
    ),
    h(
      'button',
      {
        class: 'btn-text',
        style: { color: 'var(--danger)', alignSelf: 'center' },
        onclick: () =>
          confirmSheet({
            title: editing ? 'Discard changes?' : 'Discard this workout?',
            message: editing ? 'The saved session stays as it was.' : 'Everything logged in this session will be lost.',
            confirmLabel: 'Discard',
            cancelLabel: 'Keep going',
            danger: true,
          }).then((yes) => {
            if (!yes) return;
            stopRest();
            openNotes.clear();
            discardWorkout();
            location.hash = '#/today';
          }),
      },
      editing ? 'Discard changes' : 'Discard workout',
    ),
  );
}
