import test from 'node:test';
import assert from 'node:assert/strict';

import { EXERCISE_BY_ID } from '../js/data/exercises.js';
import {
  convert,
  e1rm,
  exerciseHistory,
  increment,
  suggestNext,
  summarizeSets,
  weekStart,
  weekStreak,
  workoutPRs,
  workoutTotals,
} from '../js/logic/stats.js';
import { logSession, makeState } from './helpers.js';

const squat = EXERCISE_BY_ID.back_squat;
const target = { sets: 3, reps: [6, 8], rpe: 8 };

test('e1rm credits reps left in reserve', () => {
  assert.equal(e1rm(100, 1, 10), 100);
  assert.ok(e1rm(100, 5, 8) > e1rm(100, 5, 10));
  assert.equal(Math.round(e1rm(100, 5, 8)), Math.round(e1rm(100, 7, 10)));
  assert.equal(e1rm(0, 5, 8), 0);
});

test('convert moves between units and leaves same-unit values alone', () => {
  assert.equal(convert(100, 'lb', 'lb'), 100);
  assert.equal(convert(100, 'kg', 'lb'), 220.5);
  assert.equal(convert(225, 'lb', 'kg'), 102);
});

test('first session asks her to find a starting load', () => {
  const state = makeState();
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'start');
  assert.equal(next.weight, null);
});

test('filling the rep range on target effort adds load', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 8, 8], [135, 8, 8], [135, 8, 8]] });
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'increase');
  assert.equal(next.weight, 145);
});

test('filling the range at a grinding effort holds the weight', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 8, 9.5], [135, 8, 9.5], [135, 8, 10]] });
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'reps');
  assert.equal(next.weight, 135);
});

test('mid-range sets ask for one more rep at the same weight', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 7, 8], [135, 6, 8], [135, 6, 8.5]] });
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'reps');
  assert.equal(next.weight, 135);
  assert.equal(next.reps, 7);
});

test('missing the range at high effort backs the weight off', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[185, 4, 9.5], [185, 4, 10], [185, 3, 10]] });
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'deload');
  assert.equal(next.weight, 170);
});

test('one short set at the end of a hard session holds the weight', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[145, 6, 9], [145, 6, 9.5], [145, 5, 9.5]] });
  const next = suggestNext(state, squat, target);
  assert.equal(next.kind, 'hold');
  assert.equal(next.weight, 145);
  assert.equal(next.reps, 6);
});

test('bodyweight work that fills the range is flagged as outgrown', () => {
  const state = makeState();
  const pushup = EXERCISE_BY_ID.incline_pushup;
  logSession(state, { daysAgo: 3, exerciseId: 'incline_pushup', pattern: 'hpush', sets: [['', 12, 7], ['', 12, 7], ['', 12, 8]] });
  const next = suggestNext(state, pushup, { sets: 3, reps: [8, 12], rpe: 8 });
  assert.equal(next.kind, 'levelup');
});

test('timed holds progress in seconds', () => {
  const state = makeState();
  const plank = EXERCISE_BY_ID.plank;
  logSession(state, { daysAgo: 3, exerciseId: 'plank', pattern: 'brace', sets: [['', 30, 7], ['', 30, 7]] });
  const next = suggestNext(state, plank, { sets: 3, reps: [30, 45], rpe: 7 });
  assert.equal(next.kind, 'reps');
  assert.equal(next.reps, 35);
});

test('increments are smaller for upper body and light dumbbells', () => {
  assert.equal(increment(squat, 'lb', 135), 10);
  assert.equal(increment(EXERCISE_BY_ID.bb_bench, 'lb', 95), 5);
  assert.equal(increment(EXERCISE_BY_ID.db_lateral, 'lb', 10), 2.5);
  assert.equal(increment(squat, 'kg', 60), 5);
  assert.equal(increment(EXERCISE_BY_ID.bb_bench, 'kg', 40), 2.5);
});

test('history converts older sessions into the current unit', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', unit: 'kg', sets: [[60, 8, 8]] });
  const [session] = exerciseHistory(state, 'back_squat');
  assert.equal(session.sets[0].weight, 132.5);
});

test('history ignores warm-ups and unfinished sets', () => {
  const state = makeState();
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  state.workouts[0].entries[0].sets.push({ weight: 45, reps: 10, done: true, warmup: true });
  state.workouts[0].entries[0].sets.push({ weight: 135, reps: 8, done: false, warmup: false });
  assert.equal(exerciseHistory(state, 'back_squat')[0].sets.length, 1);
});

test('summarizeSets groups reps by weight', () => {
  const sets = [{ weight: 135, reps: 8 }, { weight: 135, reps: 7 }, { weight: 145, reps: 6 }];
  assert.equal(summarizeSets(sets, squat, 'lb'), '135 lb × 8, 7 · 145 lb × 6');
});

test('a heavier set than ever before is a record, a first session is not', () => {
  const state = makeState();
  logSession(state, { daysAgo: 14, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  assert.deepEqual(workoutPRs(state, state.workouts[0]), []);
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[145, 6, 8]] });
  const prs = workoutPRs(state, state.workouts[1]);
  assert.equal(prs.length, 1);
  assert.equal(prs[0].type, 'weight');
});

test('more reps at the same weight is an estimated-max record', () => {
  const state = makeState();
  logSession(state, { daysAgo: 14, exerciseId: 'back_squat', sets: [[135, 6, 8]] });
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  const prs = workoutPRs(state, state.workouts[1]);
  assert.equal(prs[0].type, 'e1rm');
});

test('workoutTotals counts work sets, volume and average effort', () => {
  const state = makeState();
  logSession(state, { daysAgo: 1, exerciseId: 'back_squat', sets: [[100, 5, 8], [100, 5, 9]] });
  const totals = workoutTotals(state.workouts[0], 'lb');
  assert.equal(totals.sets, 2);
  assert.equal(totals.volume, 1000);
  assert.equal(totals.avgRpe, 8.5);
  assert.equal(totals.minutes, 60);
});

test('weeks start on Monday', () => {
  const sunday = new Date(2026, 10, 8, 15, 0, 0);
  assert.equal(weekStart(sunday).getDate(), 2);
  const monday = new Date(2026, 10, 9, 0, 30, 0);
  assert.equal(weekStart(monday).getDate(), 9);
});

test('week streak counts back through consecutive weeks', () => {
  const state = makeState();
  assert.equal(weekStreak(state), 0);
  logSession(state, { daysAgo: 0, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  logSession(state, { daysAgo: 7, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  logSession(state, { daysAgo: 14, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  logSession(state, { daysAgo: 35, exerciseId: 'back_squat', sets: [[135, 8, 8]] });
  assert.equal(weekStreak(state), 3);
});
