import test from 'node:test';
import assert from 'node:assert/strict';

import { EXERCISES, EXERCISE_BY_ID, PATTERNS } from '../js/data/exercises.js';
import { PROGRAM_TEMPLATE } from '../js/data/program.js';
import { isAvailable } from '../js/logic/library.js';
import { buildProgram, dayInsights, nextDayId, rankVariations, slotInsight, targetFor } from '../js/logic/recommend.js';
import { ALL_EQUIPMENT, logSession, makeState } from './helpers.js';

test('the library is internally consistent', () => {
  const ids = new Set();
  for (const ex of EXERCISES) {
    assert.ok(!ids.has(ex.id), `duplicate id ${ex.id}`);
    ids.add(ex.id);
    assert.ok(PATTERNS[ex.pattern], `${ex.id} has unknown pattern ${ex.pattern}`);
    assert.ok([1, 2, 3].includes(ex.level), `${ex.id} has a bad level`);
    assert.ok(ex.cue, `${ex.id} has no cue`);
  }
  for (const pattern of Object.keys(PATTERNS)) {
    const pool = EXERCISES.filter((e) => e.pattern === pattern);
    assert.ok(pool.length >= 5, `${pattern} needs at least five variations`);
  }
});

test('the template only refers to real exercises of the right pattern', () => {
  for (const day of PROGRAM_TEMPLATE) {
    for (const slot of day.slots) {
      for (const id of slot.prefer) {
        assert.ok(EXERCISE_BY_ID[id], `${day.id} prefers unknown exercise ${id}`);
        assert.equal(EXERCISE_BY_ID[id].pattern, slot.pattern, `${id} is not a ${slot.pattern}`);
      }
    }
  }
});

test('the split alternates upper and lower across four days', () => {
  const program = buildProgram({ experience: 2, equipment: ALL_EQUIPMENT });
  assert.deepEqual(program.map((d) => d.region), ['upper', 'lower', 'upper', 'lower']);
  for (const day of program) {
    for (const slot of day.slots) {
      const region = PATTERNS[slot.pattern].region;
      assert.ok(region === day.region || region === 'trunk', `${slot.pattern} does not belong on ${day.name}`);
    }
  }
});

test('every core movement is trained twice a week with different variations', () => {
  const program = buildProgram({ experience: 2, equipment: ALL_EQUIPMENT });
  const slots = program.flatMap((d) => d.slots);
  const core = Object.keys(PATTERNS).filter((p) => PATTERNS[p].tier === 'core');
  for (const pattern of core) {
    const picks = slots.filter((s) => s.pattern === pattern).map((s) => s.exerciseId);
    assert.equal(picks.length, 2, `${pattern} should appear twice`);
    assert.notEqual(picks[0], picks[1], `${pattern} repeats the same variation`);
  }
  assert.equal(new Set(slots.map((s) => s.exerciseId)).size, slots.length);
});

test('the program respects equipment and experience', () => {
  const home = { experience: 1, equipment: ['dumbbell', 'band'] };
  for (const day of buildProgram(home)) {
    for (const slot of day.slots) {
      const ex = EXERCISE_BY_ID[slot.exerciseId];
      assert.ok(isAvailable(ex, home), `${ex.name} needs ${ex.equip}`);
      assert.ok(ex.level <= 2, `${ex.name} is too advanced for a newcomer`);
    }
  }
});

test('with no equipment the program keeps only what bodyweight can cover', () => {
  const none = { experience: 1, equipment: [] };
  const program = buildProgram(none);
  for (const day of program) {
    assert.ok(day.slots.length >= 4, `${day.name} is too thin`);
    for (const slot of day.slots) assert.equal(EXERCISE_BY_ID[slot.exerciseId].equip, 'bodyweight');
  }
  const patterns = new Set(program.flatMap((d) => d.slots.map((s) => s.pattern)));
  for (const p of ['squat', 'hinge', 'lunge', 'hpush', 'vpush', 'hpull']) assert.ok(patterns.has(p), `${p} is missing`);
});

test('newcomers start on foundational main lifts', () => {
  const program = buildProgram({ experience: 1, equipment: ALL_EQUIPMENT });
  const squatSlot = program[1].slots[0];
  assert.equal(squatSlot.exerciseId, 'goblet_squat');
  const experienced = buildProgram({ experience: 2, equipment: ALL_EQUIPMENT });
  assert.equal(experienced[1].slots[0].exerciseId, 'back_squat');
});

test('next day follows the last finished day and wraps around', () => {
  const state = makeState();
  assert.equal(nextDayId(state), 'upperA');
  logSession(state, { daysAgo: 2, dayId: 'upperA', exerciseId: 'bb_bench', pattern: 'hpush', sets: [[95, 8, 8]] });
  assert.equal(nextDayId(state), 'lowerA');
  logSession(state, { daysAgo: 1, dayId: 'lowerB', exerciseId: 'trapbar_dl', pattern: 'hinge', sets: [[135, 5, 8]] });
  assert.equal(nextDayId(state), 'upperA');
});

test('recommendations skip the current pick, hidden lifts and missing equipment', () => {
  const state = makeState({ settings: { experience: 2, equipment: ['dumbbell', 'kettlebell'] } });
  state.hidden = ['plie_squat'];
  const slot = state.program[1].slots[0];
  const { recommended, others } = rankVariations(state, { pattern: 'squat', currentId: slot.exerciseId, dayId: 'lowerA' });
  assert.equal(recommended.length, 3);
  for (const item of recommended) {
    assert.notEqual(item.ex.id, slot.exerciseId);
    assert.notEqual(item.ex.id, 'plie_squat');
    assert.ok(item.available);
    assert.ok(item.reasons.length);
  }
  assert.ok(others.some((i) => i.ex.id === 'back_squat' && !i.available));
  assert.ok(others[0].isCurrent);
});

test('recommendations avoid the variation used on the sibling day', () => {
  const state = makeState();
  const sibling = state.program[3].slots.find((s) => s.pattern === 'squat').exerciseId;
  const { recommended } = rankVariations(state, { pattern: 'squat', currentId: 'back_squat', dayId: 'lowerA' });
  assert.ok(!recommended.some((i) => i.ex.id === sibling));
});

test('favorites rise to the top', () => {
  const state = makeState();
  state.favorites = ['smith_squat'];
  const { recommended } = rankVariations(state, { pattern: 'squat', currentId: 'back_squat', dayId: 'lowerA' });
  assert.equal(recommended[0].ex.id, 'smith_squat');
  assert.equal(recommended[0].reasons[0], 'A favorite');
});

test('advanced lifts are held back from newcomers', () => {
  const state = makeState({ settings: { experience: 1, equipment: ALL_EQUIPMENT } });
  const { recommended } = rankVariations(state, { pattern: 'hinge', currentId: 'rdl_db', dayId: 'lowerA' });
  assert.ok(recommended.every((i) => i.ex.level <= 2));
});

test('timed exercises use their own hold range', () => {
  const slot = { sets: 3, reps: [8, 12], rpe: 7 };
  assert.deepEqual(targetFor(slot, EXERCISE_BY_ID.plank).reps, [30, 45]);
  assert.deepEqual(targetFor(slot, EXERCISE_BY_ID.dead_bug).reps, [8, 12]);
});

test('a fresh program raises no insights', () => {
  const state = makeState();
  for (const day of state.program) assert.deepEqual(dayInsights(state, day), []);
});

test('three flat sessions raise a plateau with a replacement', () => {
  const state = makeState();
  const slot = state.program[1].slots[0];
  for (const daysAgo of [21, 14, 7]) {
    logSession(state, { daysAgo, exerciseId: slot.exerciseId, slotId: slot.id, sets: [[185, 6, 9], [185, 6, 9], [185, 6, 9]] });
  }
  const insight = slotInsight(state, slot, 'lowerA');
  assert.equal(insight.type, 'plateau');
  assert.notEqual(insight.suggestion.id, slot.exerciseId);
  assert.equal(insight.suggestion.pattern, 'squat');
});

test('steady progress raises nothing', () => {
  const state = makeState();
  const slot = state.program[1].slots[0];
  [[21, 6], [14, 7], [7, 7]].forEach(([daysAgo, reps], i) => {
    logSession(state, { daysAgo, exerciseId: slot.exerciseId, slotId: slot.id, sets: [[185 + i * 5, reps, 8]] });
  });
  assert.equal(slotInsight(state, slot, 'lowerA'), null);
});

test('outgrowing a bodyweight variation suggests a harder or loaded one', () => {
  const state = makeState({ settings: { experience: 1, equipment: ['dumbbell'] } });
  const slot = state.program[0].slots[0];
  slot.exerciseId = 'incline_pushup';
  logSession(state, { daysAgo: 3, dayId: 'upperA', exerciseId: 'incline_pushup', slotId: slot.id, pattern: 'hpush', sets: [['', 8, 6], ['', 8, 6], ['', 8, 7]] });
  const insight = slotInsight(state, slot, 'upperA');
  assert.equal(insight.type, 'levelup');
  const next = insight.suggestion;
  assert.ok(next.level > 1 || !next.bw);
});

test('two grinding sessions below the range suggest an easier variation', () => {
  const state = makeState({ settings: { experience: 3, equipment: ALL_EQUIPMENT } });
  const slot = state.program[2].slots[0];
  assert.equal(slot.exerciseId, 'pullup');
  for (const daysAgo of [10, 3]) {
    logSession(state, { daysAgo, dayId: 'upperB', exerciseId: 'pullup', slotId: slot.id, pattern: 'vpull', sets: [['', 3, 10], ['', 2, 10]] });
  }
  const insight = slotInsight(state, slot, 'upperB');
  assert.equal(insight.type, 'regress');
  assert.ok(insight.suggestion.level < 3);
});

test('a long run on one accessory suggests a fresh variation once progress slows', () => {
  const state = makeState();
  const slot = state.program[0].slots.find((s) => s.pattern === 'lateral');
  const log = (i, weight) =>
    logSession(state, { daysAgo: 49 - i * 7, dayId: 'upperA', exerciseId: slot.exerciseId, slotId: slot.id, pattern: 'lateral', sets: [[weight, 12, 8]] });
  for (let i = 0; i < 6; i += 1) log(i, 10 + i);
  assert.equal(slotInsight(state, slot, 'upperA'), null, 'still improving, leave it alone');
  log(6, 15);
  const insight = slotInsight(state, slot, 'upperA');
  assert.equal(insight.type, 'stale');
  assert.equal(insight.suggestion.pattern, 'lateral');
});

test('losing a piece of equipment flags the slots that need it', () => {
  const state = makeState();
  state.settings.equipment = ['dumbbell'];
  const insights = dayInsights(state, state.program[1]);
  assert.ok(insights.length > 0);
  assert.equal(insights[0].type, 'unavailable');
  assert.ok(isAvailable(insights[0].suggestion, state.settings));
});
