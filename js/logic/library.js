// Lookups over the built-in exercise library plus any custom exercises.

import { EXERCISES, EXERCISE_BY_ID } from '../data/exercises.js';

export function allExercises(state) {
  return state.customExercises && state.customExercises.length
    ? EXERCISES.concat(state.customExercises)
    : EXERCISES;
}

export function getExercise(state, id) {
  if (EXERCISE_BY_ID[id]) return EXERCISE_BY_ID[id];
  const custom = (state.customExercises || []).find((e) => e.id === id);
  if (custom) return custom;
  // An exercise that was deleted after being logged still needs a name.
  return { id, name: 'Removed exercise', pattern: 'squat', equip: 'bodyweight', level: 1, missing: true };
}

export function isAvailable(ex, settings) {
  return ex.equip === 'bodyweight' || settings.equipment.includes(ex.equip);
}

export function exercisesForPattern(state, pattern) {
  return allExercises(state).filter((e) => e.pattern === pattern);
}
