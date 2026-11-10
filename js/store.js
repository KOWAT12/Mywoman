// App state: one object, persisted to localStorage on every change.

import { DEFAULT_TARGET } from './data/program.js';
import { getExercise } from './logic/library.js';
import { buildProgram, targetFor } from './logic/recommend.js';
import { num } from './logic/stats.js';

const KEY = 'clave.v1';

export const DEFAULT_SETTINGS = {
  name: '',
  unit: 'lb',
  experience: 2,
  equipment: ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'band', 'pullup'],
  restMain: 150,
  restAccessory: 75,
  askRpe: true,
  sound: true,
  vibrate: true,
  theme: 'auto',
  weeklyGoal: 4,
};

function freshState() {
  return {
    version: 1,
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    program: [],
    favorites: [],
    hidden: [],
    customExercises: [],
    workouts: [],
    active: null,
  };
}

let state = freshState();
let storageOk = true;
const listeners = new Set();

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function normalize(raw) {
  const base = freshState();
  const s = { ...base, ...raw };
  s.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
  for (const key of ['program', 'favorites', 'hidden', 'customExercises', 'workouts']) {
    if (!Array.isArray(s[key])) s[key] = base[key];
  }
  if (s.onboarded && !s.program.length) s.program = buildProgram(s.settings);
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = normalize(JSON.parse(raw));
  } catch (err) {
    console.error('Could not read saved data', err);
    storageOk = false;
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch (err) {
    console.error('Could not save', err);
    storageOk = false;
  }
  return storageOk;
}

export function isStorageOk() {
  return storageOk;
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Change state, persist, and (unless told otherwise) redraw.
export function update(fn, { render = true } = {}) {
  fn(state);
  save();
  if (render) for (const l of listeners) l(state);
}

// ── Setup ──────────────────────────────────────────────────────────────────

export function completeOnboarding(settings) {
  update((s) => {
    s.settings = { ...s.settings, ...settings };
    s.program = buildProgram(s.settings);
    s.onboarded = true;
  });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

export function rebuildProgram() {
  update((s) => {
    s.program = buildProgram(s.settings);
  });
}

export function findSlot(s, slotId) {
  for (const day of s.program) {
    const slot = day.slots.find((x) => x.id === slotId);
    if (slot) return { day, slot };
  }
  return null;
}

export function setSlotExercise(slotId, exerciseId) {
  update((s) => {
    const found = findSlot(s, slotId);
    if (found) found.slot.exerciseId = exerciseId;
  });
}

// ── Workouts ───────────────────────────────────────────────────────────────

const blankSet = () => ({ weight: '', reps: '', rpe: null, done: false, warmup: false });

function makeEntry(s, { slot = null, pattern, exerciseId }) {
  const ex = getExercise(s, exerciseId);
  const target = targetFor(slot || DEFAULT_TARGET, ex);
  return {
    id: uid(),
    slotId: slot ? slot.id : null,
    pattern,
    exerciseId,
    target,
    sets: Array.from({ length: target.sets }, blankSet),
    note: '',
  };
}

export function startWorkout(dayId) {
  update((s) => {
    const day = s.program.find((d) => d.id === dayId);
    if (!day) return;
    s.active = {
      id: uid(),
      dayId: day.id,
      dayName: day.name,
      region: day.region,
      focus: day.focus,
      unit: s.settings.unit,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      notes: '',
      warmupDone: [],
      entries: day.slots.map((slot) => makeEntry(s, { slot, pattern: slot.pattern, exerciseId: slot.exerciseId })),
    };
  });
}

export function addEntry(pattern, exerciseId) {
  update((s) => {
    if (s.active) s.active.entries.push(makeEntry(s, { pattern, exerciseId }));
  });
}

export function removeEntry(entryId) {
  update((s) => {
    if (s.active) s.active.entries = s.active.entries.filter((e) => e.id !== entryId);
  });
}

// Swap the variation for an exercise in the session. Sets already done stay
// with the lift they were done on; the new variation takes over the slot so
// the plan remembers it next time.
export function swapEntryExercise(entryId, exerciseId) {
  update((s) => {
    const a = s.active;
    if (!a) return;
    const index = a.entries.findIndex((e) => e.id === entryId);
    if (index < 0) return;
    const entry = a.entries[index];
    if (entry.exerciseId === exerciseId) return;
    const found = entry.slotId ? findSlot(s, entry.slotId) : null;
    const slot = found ? found.slot : null;
    const fresh = makeEntry(s, { slot, pattern: entry.pattern, exerciseId });

    const done = entry.sets.filter((x) => x.done);
    if (done.length) {
      entry.sets = done;
      entry.slotId = null;
      const remaining = Math.max(1, fresh.sets.length - done.length);
      fresh.sets = fresh.sets.slice(0, remaining);
      a.entries.splice(index + 1, 0, fresh);
    } else {
      fresh.note = entry.note;
      a.entries.splice(index, 1, fresh);
    }
    if (slot && !a.editingId) slot.exerciseId = exerciseId;
  });
}

function cleanSet(set) {
  return {
    weight: num(set.weight) || '',
    reps: num(set.reps),
    rpe: set.rpe ? num(set.rpe) : null,
    done: true,
    warmup: Boolean(set.warmup),
  };
}

// Save the session. Only completed sets are kept. Returns the workout id, or
// null if nothing was logged.
export function finishWorkout(notes = '') {
  const a = state.active;
  if (!a) return null;
  const entries = a.entries
    .map((e) => ({
      id: e.id,
      slotId: e.slotId,
      pattern: e.pattern,
      exerciseId: e.exerciseId,
      target: e.target,
      note: e.note || '',
      sets: e.sets.filter((x) => x.done && num(x.reps) > 0).map(cleanSet),
    }))
    .filter((e) => e.sets.length);
  if (!entries.length) return null;

  const id = a.editingId || a.id;
  update((s) => {
    const workout = {
      id,
      dayId: a.dayId,
      dayName: a.dayName,
      region: a.region,
      focus: a.focus,
      unit: a.unit,
      startedAt: a.startedAt,
      finishedAt: a.editingId ? a.finishedAt : new Date().toISOString(),
      notes,
      entries,
    };
    const existing = s.workouts.findIndex((w) => w.id === id);
    if (existing >= 0) s.workouts[existing] = workout;
    else s.workouts.push(workout);
    s.active = null;
  });
  return id;
}

export function discardWorkout() {
  update((s) => {
    s.active = null;
  });
}

export function deleteWorkout(id) {
  update((s) => {
    s.workouts = s.workouts.filter((w) => w.id !== id);
  });
}

// Re-open a saved session for corrections.
export function editWorkout(id) {
  update((s) => {
    const w = s.workouts.find((x) => x.id === id);
    if (!w || s.active) return;
    const copy = JSON.parse(JSON.stringify(w));
    s.active = { ...copy, id: uid(), editingId: w.id, warmupDone: [] };
  });
}

// ── Library preferences ────────────────────────────────────────────────────

function toggleIn(list, id) {
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
}

export function toggleFavorite(id) {
  update((s) => {
    toggleIn(s.favorites, id);
    s.hidden = s.hidden.filter((x) => x !== id);
  });
}

export function toggleHidden(id) {
  update((s) => {
    toggleIn(s.hidden, id);
    s.favorites = s.favorites.filter((x) => x !== id);
  });
}

export function addCustomExercise(fields) {
  const id = `c_${uid()}`;
  update((s) => {
    s.customExercises.push({ ...fields, id, custom: true });
  });
  return id;
}

export function deleteCustomExercise(id) {
  update((s) => {
    s.customExercises = s.customExercises.filter((e) => e.id !== id);
    s.favorites = s.favorites.filter((x) => x !== id);
    s.hidden = s.hidden.filter((x) => x !== id);
  });
}

// ── Backup ─────────────────────────────────────────────────────────────────

export function exportData() {
  return JSON.stringify({ app: 'clave', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importData(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !Array.isArray(data.workouts) || !data.settings) {
    throw new Error('That file is not a Clave backup.');
  }
  const { app, exportedAt, ...rest } = data;
  state = normalize(rest);
  save();
  for (const l of listeners) l(state);
}

export function resetAll() {
  state = freshState();
  save();
  for (const l of listeners) l(state);
}
