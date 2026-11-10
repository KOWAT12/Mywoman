// Variation recommendations.
//
// Three jobs:
//   buildProgram    fills the upper/lower template with variations that fit
//                   the lifter's equipment and experience.
//   rankVariations  orders every variation of a movement pattern, best first,
//                   with a reason for each.
//   slotInsight     notices when the current variation has stopped working
//                   (plateau, outgrown, too hard, stale, no equipment) and
//                   names a replacement.

import { EXERCISES, EXERCISE_BY_ID, EQUIP_LABEL, PATTERNS } from '../data/exercises.js';
import { PROGRAM_TEMPLATE } from '../data/program.js';
import { exercisesForPattern, getExercise, isAvailable } from './library.js';
import { exerciseHistory, finishedWorkouts, suggestNext } from './stats.js';

const DAY_MS = 86400000;

// Sessions in a row on one variation before a fresh one is suggested, and
// then only if progress has slowed.
const STALE_AFTER = { core: 10, accessory: 6, trunk: 6 };

export function targetFor(slot, ex) {
  return {
    sets: slot.sets,
    reps: ex.timed ? ex.hold || [30, 45] : slot.reps,
    rpe: slot.rpe,
  };
}

// ── Building the program ───────────────────────────────────────────────────

// The first variation, in order of preference, that fits the equipment and
// experience and is not already used elsewhere in the week. Returns null when
// nothing in the pattern can be done with the equipment at hand.
function pickDefault(slot, settings, taken) {
  const prefer = slot.prefer.map((id) => EXERCISE_BY_ID[id]).filter(Boolean);
  const pool = EXERCISES.filter((ex) => ex.pattern === slot.pattern);
  const ok = (ex, maxLevel) => isAvailable(ex, settings) && !taken.has(ex.id) && ex.level <= maxLevel;
  const pick =
    prefer.find((ex) => ok(ex, settings.experience)) ||
    pool.find((ex) => ok(ex, settings.experience)) ||
    prefer.find((ex) => ok(ex, 3)) ||
    pool.find((ex) => ok(ex, 3)) ||
    pool.find((ex) => isAvailable(ex, settings));
  return pick ? pick.id : null;
}

export function buildProgram(settings) {
  const taken = new Set();
  return PROGRAM_TEMPLATE.map((day) => ({
    id: day.id,
    name: day.name,
    region: day.region,
    focus: day.focus,
    slots: day.slots
      .map((slot, i) => {
        const exerciseId = pickDefault(slot, settings, taken);
        if (!exerciseId) return null;
        taken.add(exerciseId);
        return {
          id: `${day.id}-${i + 1}`,
          pattern: slot.pattern,
          sets: slot.sets,
          reps: [...slot.reps],
          rpe: slot.rpe,
          exerciseId,
        };
      })
      .filter(Boolean),
  }));
}

// The split runs in order: whatever follows the last finished day is next.
export function nextDayId(state) {
  const program = state.program || [];
  if (!program.length) return null;
  const last = finishedWorkouts(state).find((w) => program.some((d) => d.id === w.dayId));
  if (!last) return program[0].id;
  const i = program.findIndex((d) => d.id === last.dayId);
  return program[(i + 1) % program.length].id;
}

// ── Ranking variations ─────────────────────────────────────────────────────

export function rankVariations(state, { pattern, currentId = null, dayId = null, target = null, intent = null, now = Date.now() }) {
  const { settings } = state;
  const exp = settings.experience;
  const current = currentId ? getExercise(state, currentId) : null;
  const favorites = state.favorites || [];
  const hidden = state.hidden || [];

  const inSession = new Set();
  const inOtherDays = new Set();
  for (const day of state.program || []) {
    for (const slot of day.slots) {
      if (slot.exerciseId === currentId) continue;
      if (day.id === dayId) inSession.add(slot.exerciseId);
      else if (slot.pattern === pattern) inOtherDays.add(slot.exerciseId);
    }
  }

  const items = exercisesForPattern(state, pattern).map((ex) => {
    const reasons = [];
    let score = 50;

    // Right level: at her level is ideal, above it is a reach.
    if (ex.level > exp) score -= 30 * (ex.level - exp);
    else score += 10 - 4 * (exp - ex.level);

    // What the situation calls for goes first in the list of reasons.
    if (intent === 'levelup' && current) {
      if (ex.level > current.level || (current.bw && !ex.bw)) {
        score += 20;
        reasons.push(`A step up from ${current.name}`);
      } else {
        score -= 10;
      }
    }
    if (intent === 'regress' && current) {
      if (ex.level < current.level) {
        score += 20;
        reasons.push('An easier build-up');
      } else if (ex.level > current.level) {
        score -= 15;
      }
    }
    if (intent === 'plateau' && current && ex.equip !== current.equip) {
      score += 6;
      reasons.push('A different stimulus');
    }

    // Freshness.
    const history = exerciseHistory(state, ex.id);
    if (!history.length) {
      score += 10;
      reasons.push('New for you');
    } else {
      const days = Math.floor((now - new Date(history[0].date).getTime()) / DAY_MS);
      if (days >= 28) {
        score += 8;
        reasons.push(`Last done ${Math.round(days / 7)} weeks ago`);
      } else if (ex.id !== currentId) {
        score -= 4;
        reasons.push('Done recently');
      }
    }

    if (favorites.includes(ex.id)) {
      score += 14;
      reasons.unshift('A favorite');
    }
    if (ex.dance) {
      score += 8;
      reasons.push('Dance carry-over');
    }
    if (ex.custom) reasons.push('Your own');

    // Keep the A and B days different.
    if (inOtherDays.has(ex.id)) {
      score -= 25;
      reasons.push('Already on another day');
    }

    // Heavy slots want lifts that load well; light slots do not need them.
    if (target && !ex.timed) {
      if (target.reps[0] <= 6) score += ex.heavy ? 10 : ex.bw ? -10 : -6;
      else if (target.reps[0] >= 10 && ex.heavy && ex.equip === 'barbell') score -= 4;
    }

    const available = isAvailable(ex, settings);
    return {
      ex,
      score,
      reasons,
      available,
      hidden: hidden.includes(ex.id),
      isCurrent: ex.id === currentId,
      inSession: inSession.has(ex.id),
    };
  });

  const byScore = (a, b) => b.score - a.score || a.ex.level - b.ex.level || a.ex.name.localeCompare(b.ex.name);
  const eligible = items.filter((i) => i.available && !i.hidden && !i.isCurrent && !i.inSession).sort(byScore);
  const recommended = eligible.slice(0, 3);
  const picked = new Set(recommended.map((i) => i.ex.id));
  const others = items
    .filter((i) => !picked.has(i.ex.id))
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || Number(b.available) - Number(a.available) || byScore(a, b));

  return { recommended, others, all: items };
}

// ── Noticing when a variation should change ────────────────────────────────

// How many sessions in a row this slot has used its current variation.
export function slotRun(state, slot) {
  let run = 0;
  for (const w of finishedWorkouts(state)) {
    const entry = w.entries.find((e) => e.slotId === slot.id);
    if (!entry) continue;
    if (entry.exerciseId !== slot.exerciseId) break;
    run += 1;
  }
  return run;
}

// No improvement across the last three sessions of an exercise.
export function isPlateaued(history) {
  if (history.length < 3) return false;
  const [a, b, c] = history;
  if (!a.metric || !b.metric || !c.metric) return false;
  if (a.metric.kind !== c.metric.kind || b.metric.kind !== c.metric.kind) return false;
  const ceiling = c.metric.value * 1.005;
  return a.metric.value <= ceiling && b.metric.value <= ceiling;
}

// Not one set reaching the bottom of the rep range, at high effort, two
// sessions running: the variation itself is too hard for now.
function isStruggling(history, target) {
  if (history.length < 2) return false;
  return history.slice(0, 2).every((h) => {
    const rpes = h.sets.filter((s) => s.rpe).map((s) => s.rpe);
    const avg = rpes.length ? rpes.reduce((x, y) => x + y, 0) / rpes.length : null;
    return Math.max(...h.sets.map((s) => s.reps)) < target.reps[0] && avg != null && avg >= target.rpe + 1;
  });
}

// The latest session was no better than the one before it. A long run on one
// variation is only worth changing once it stops paying off.
function hasStalled(history) {
  if (history.length < 2) return false;
  const [a, b] = history;
  return Boolean(a.metric && b.metric && a.metric.kind === b.metric.kind && a.metric.value <= b.metric.value * 1.005);
}

const INSIGHT_ORDER = ['unavailable', 'regress', 'plateau', 'levelup', 'stale'];

export function slotInsight(state, slot, dayId) {
  const ex = getExercise(state, slot.exerciseId);
  const target = targetFor(slot, ex);
  let type = null;
  let text = '';

  if (ex.missing) {
    type = 'unavailable';
    text = 'This exercise was removed from your library.';
  } else if (!isAvailable(ex, state.settings)) {
    type = 'unavailable';
    text = `${EQUIP_LABEL[ex.equip] || 'This equipment'} is not in your equipment list.`;
  } else {
    const history = exerciseHistory(state, ex.id);
    const tier = PATTERNS[slot.pattern] ? PATTERNS[slot.pattern].tier : 'accessory';
    const run = slotRun(state, slot);
    if (isStruggling(history, target)) {
      type = 'regress';
      text = 'Two hard sessions without reaching the rep range.';
    } else if (isPlateaued(history)) {
      type = 'plateau';
      text = 'No progress across the last three sessions.';
    } else if (history.length && suggestNext(state, ex, target).kind === 'levelup') {
      type = 'levelup';
      text = 'Every set reached the top of the range.';
    } else if (run >= STALE_AFTER[tier] && hasStalled(history)) {
      type = 'stale';
      text = `${run} sessions in a row on this variation, and progress has slowed.`;
    }
  }
  if (!type) return null;

  const ranked = rankVariations(state, { pattern: slot.pattern, currentId: ex.id, dayId, target, intent: type });
  let pool = ranked.recommended;
  if (type === 'levelup') pool = pool.filter((i) => i.ex.level > ex.level || (ex.bw && !i.ex.bw));
  if (type === 'regress') pool = pool.filter((i) => i.ex.level < ex.level);
  const pick = pool[0];
  if (!pick) return null;

  return { type, text, slotId: slot.id, dayId, current: ex, suggestion: pick.ex, why: pick.reasons[0] || '' };
}

export function dayInsights(state, day) {
  return day.slots
    .map((slot) => slotInsight(state, slot, day.id))
    .filter(Boolean)
    .sort((a, b) => INSIGHT_ORDER.indexOf(a.type) - INSIGHT_ORDER.indexOf(b.type));
}

export const INSIGHT_TITLE = {
  unavailable: 'Needs a swap',
  regress: 'Build back up',
  plateau: 'Plateau',
  levelup: 'Ready for more',
  stale: 'Time for a change',
};
