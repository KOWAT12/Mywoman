// Builders for test state.

import { buildProgram } from '../js/logic/recommend.js';

export const ALL_EQUIPMENT = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'band', 'pullup'];

export function makeState(overrides = {}) {
  const settings = {
    name: '',
    unit: 'lb',
    experience: 2,
    equipment: ALL_EQUIPMENT,
    ...(overrides.settings || {}),
  };
  return {
    version: 1,
    settings,
    program: buildProgram(settings),
    favorites: [],
    hidden: [],
    customExercises: [],
    workouts: [],
    active: null,
    ...overrides,
    settings,
  };
}

let counter = 0;

// sets: array of [weight, reps, rpe]
export function logSession(state, { daysAgo, dayId = 'lowerA', exerciseId, slotId = null, pattern = 'squat', sets, unit }) {
  const start = new Date(Date.now() - daysAgo * 86400000);
  counter += 1;
  state.workouts.push({
    id: `w${counter}`,
    dayId,
    dayName: dayId,
    unit: unit || state.settings.unit,
    startedAt: start.toISOString(),
    finishedAt: new Date(start.getTime() + 3600000).toISOString(),
    entries: [
      {
        id: `e${counter}`,
        slotId,
        pattern,
        exerciseId,
        sets: sets.map(([weight, reps, rpe]) => ({ weight, reps, rpe, done: true, warmup: false })),
      },
    ],
  });
}
