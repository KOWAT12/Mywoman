// Pure training maths: unit conversion, estimated 1RM, history lookups,
// load progression, personal records and weekly summaries.
// Nothing in here touches the DOM or storage, so it can be unit-tested.

import { PATTERNS } from '../data/exercises.js';
import { getExercise } from './library.js';

const KG_PER_LB = 0.45359237;

export function num(v) {
  if (v === '' || v == null) return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function roundTo(value, step) {
  if (!step) return value;
  return Math.round(value / step) * step;
}

export function convert(weight, from, to) {
  const w = num(weight);
  if (!w || !from || !to || from === to) return w;
  const out = from === 'lb' ? w * KG_PER_LB : w / KG_PER_LB;
  return roundTo(out, 0.5);
}

export function fmtWeight(w) {
  const n = num(w);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// Epley estimate, with reps-in-reserve taken from RPE so a set of 5 at RPE 8
// counts like a set of 7 taken to the limit.
export function e1rm(weight, reps, rpe) {
  const w = num(weight);
  const r = num(reps);
  if (w <= 0 || r <= 0) return 0;
  const rir = rpe ? Math.max(0, Math.min(4, 10 - num(rpe))) : 0;
  const effective = Math.min(r + rir, 20);
  if (effective <= 1) return w;
  return w * (1 + effective / 30);
}

export function workSets(entry) {
  return (entry.sets || []).filter((s) => s.done && !s.warmup && num(s.reps) > 0);
}

// The single number that describes how a session of an exercise went.
// Weighted work is compared by estimated 1RM, bodyweight work by best reps,
// timed holds by longest hold.
export function sessionMetric(sets, ex) {
  if (!sets.length) return null;
  if (ex && ex.timed) return { kind: 'time', value: Math.max(...sets.map((s) => num(s.reps))) };
  const weighted = sets.filter((s) => num(s.weight) > 0);
  if (weighted.length) {
    return { kind: 'e1rm', value: Math.max(...weighted.map((s) => e1rm(s.weight, s.reps, s.rpe))) };
  }
  return { kind: 'reps', value: Math.max(...sets.map((s) => num(s.reps))) };
}

export function finishedWorkouts(state) {
  return state.workouts
    .filter((w) => w.finishedAt)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

// Every finished session of one exercise, newest first, with weights expressed
// in the lifter's current unit.
export function exerciseHistory(state, exerciseId, { before } = {}) {
  const unit = state.settings.unit;
  const ex = getExercise(state, exerciseId);
  const out = [];
  for (const w of finishedWorkouts(state)) {
    if (before && new Date(w.startedAt) >= new Date(before)) continue;
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue;
      const sets = workSets(entry).map((s) => ({
        weight: convert(s.weight, w.unit || unit, unit),
        reps: num(s.reps),
        rpe: s.rpe ? num(s.rpe) : null,
      }));
      if (!sets.length) continue;
      out.push({
        workoutId: w.id,
        date: w.startedAt,
        slotId: entry.slotId || null,
        sets,
        metric: sessionMetric(sets, ex),
        topWeight: Math.max(...sets.map((s) => s.weight)),
        volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      });
    }
  }
  return out;
}

export function summarizeSets(sets, ex, unit) {
  if (!sets.length) return '';
  const label = ex && ex.timed ? 's' : '';
  const groups = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.weight === s.weight) last.reps.push(s.reps);
    else groups.push({ weight: s.weight, reps: [s.reps] });
  }
  return groups
    .map((g) => {
      const reps = g.reps.map((r) => `${r}${label}`).join(', ');
      return g.weight > 0 ? `${fmtWeight(g.weight)} ${unit} × ${reps}` : reps;
    })
    .join(' · ');
}

// Smallest sensible jump for an exercise.
export function increment(ex, unit, weight = 0) {
  const region = PATTERNS[ex.pattern] ? PATTERNS[ex.pattern].region : 'upper';
  const big = region === 'lower' && (ex.equip === 'barbell' || ex.equip === 'machine');
  if (unit === 'kg') {
    if (ex.equip === 'dumbbell' && weight < 10) return 1;
    return big ? 5 : 2.5;
  }
  if (ex.equip === 'dumbbell' && weight < 20) return 2.5;
  return big ? 10 : 5;
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// What to aim for today, from the last session of this exercise.
// Double progression with RPE as the brake: fill the rep range at a weight
// before adding load, and only add load when the effort was on target.
export function suggestNext(state, ex, target) {
  const unit = state.settings.unit;
  const [lo, hi] = target.reps;
  const history = exerciseHistory(state, ex.id);
  const unitLabel = ex.timed ? 's' : ' reps';

  if (!history.length) {
    return {
      kind: 'start',
      weight: null,
      reps: null,
      last: null,
      text: ex.timed
        ? `First time: hold ${lo} to ${hi} seconds with clean form.`
        : ex.bw
          ? `First time: stop each set with about ${10 - target.rpe} reps left.`
          : `First time: pick a load you could move for about ${hi + (10 - target.rpe)} reps.`,
    };
  }

  const last = history[0];
  const sets = last.sets;

  // The working weight is the load most sets were done at.
  const counts = new Map();
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) || 0) + 1);
  let weight = 0;
  let best = 0;
  for (const [w, c] of counts) {
    if (c > best || (c === best && w > weight)) {
      weight = w;
      best = c;
    }
  }
  const atWeight = sets.filter((s) => s.weight === weight);
  const minReps = Math.min(...atWeight.map((s) => s.reps));
  const avgRpe = mean(atWeight.filter((s) => s.rpe).map((s) => s.rpe));
  const filled = atWeight.length >= Math.min(target.sets, 2) && minReps >= hi;
  const hard = avgRpe != null && avgRpe >= target.rpe + 1;
  const short = atWeight.filter((s) => s.reps < lo).length;
  const under = short > 0;
  // Missing on the first set, or on most sets, means the load is too heavy.
  // Missing only at the end of a hard session just means one more try.
  const wellUnder = atWeight[0].reps < lo || short * 2 > atWeight.length;
  const base = { last, weight: weight || null };

  if (ex.timed) {
    if (filled && !hard) {
      return { ...base, kind: 'increase', reps: hi + 5, text: `Add 5 seconds per set, or hold a little weight.` };
    }
    return { ...base, kind: 'reps', reps: Math.min(hi, Math.max(lo, minReps + 5)), text: `Build toward ${hi} seconds on every set.` };
  }

  if (!weight) {
    if (filled && !hard) {
      return {
        ...base,
        kind: 'levelup',
        reps: hi,
        text: `Every set reached ${hi}. Add load or move to a harder variation.`,
      };
    }
    const aim = Math.min(hi, Math.max(lo, minReps + 1));
    return { ...base, kind: 'reps', reps: aim, text: `Aim for ${aim}${unitLabel} on each set.` };
  }

  const step = increment(ex, unit, weight);

  if (filled && !hard) {
    const next = weight + step;
    return {
      ...base,
      kind: 'increase',
      weight: next,
      reps: lo,
      text: `Range filled. Go up to ${fmtWeight(next)} ${unit} for ${lo} to ${hi}.`,
    };
  }

  if (wellUnder && hard) {
    const next = Math.max(step, roundTo(weight * 0.9, step));
    return {
      ...base,
      kind: 'deload',
      weight: next,
      reps: lo,
      text: `That was a grind. Drop to ${fmtWeight(next)} ${unit} and own ${lo} to ${hi}.`,
    };
  }

  if (under) {
    return { ...base, kind: 'hold', reps: lo, text: `Stay at ${fmtWeight(weight)} ${unit} and get every set to ${lo}.` };
  }

  const aim = Math.min(hi, minReps + 1);
  return {
    ...base,
    kind: 'reps',
    reps: aim,
    text: hard
      ? `Stay at ${fmtWeight(weight)} ${unit}. Same reps, smoother effort.`
      : `Stay at ${fmtWeight(weight)} ${unit} and reach for ${aim} per set.`,
  };
}

// ── Personal records ───────────────────────────────────────────────────────

export function allTimeBests(state, exerciseId, { before } = {}) {
  const history = exerciseHistory(state, exerciseId, { before });
  const bests = { e1rm: 0, weight: 0, reps: 0, time: 0, sessions: history.length };
  for (const h of history) {
    if (h.metric) bests[h.metric.kind] = Math.max(bests[h.metric.kind], h.metric.value);
    bests.weight = Math.max(bests.weight, h.topWeight);
  }
  return bests;
}

// Records set in one workout, compared with everything logged before it.
// A first-ever session sets a baseline rather than a record.
export function workoutPRs(state, workout) {
  const unit = state.settings.unit;
  const prs = [];
  for (const entry of workout.entries) {
    const ex = getExercise(state, entry.exerciseId);
    const sets = workSets(entry).map((s) => ({
      weight: convert(s.weight, workout.unit || unit, unit),
      reps: num(s.reps),
      rpe: s.rpe ? num(s.rpe) : null,
    }));
    if (!sets.length || ex.missing) continue;
    const prior = allTimeBests(state, entry.exerciseId, { before: workout.startedAt });
    if (!prior.sessions) continue;
    const metric = sessionMetric(sets, ex);
    const topWeight = Math.max(...sets.map((s) => s.weight));
    if (topWeight > 0 && topWeight > prior.weight && prior.weight > 0) {
      prs.push({ exerciseId: ex.id, name: ex.name, type: 'weight', label: `${fmtWeight(topWeight)} ${unit}`, detail: 'Heaviest set' });
    } else if (metric.kind === 'e1rm' && prior.e1rm > 0 && metric.value > prior.e1rm * 1.001) {
      prs.push({ exerciseId: ex.id, name: ex.name, type: 'e1rm', label: `${fmtWeight(Math.round(metric.value))} ${unit}`, detail: 'Best estimated max' });
    } else if (metric.kind === 'reps' && prior.reps > 0 && metric.value > prior.reps) {
      prs.push({ exerciseId: ex.id, name: ex.name, type: 'reps', label: `${metric.value} reps`, detail: 'Most reps' });
    } else if (metric.kind === 'time' && prior.time > 0 && metric.value > prior.time) {
      prs.push({ exerciseId: ex.id, name: ex.name, type: 'time', label: `${metric.value} s`, detail: 'Longest hold' });
    }
  }
  return prs;
}

// ── Workout and week summaries ─────────────────────────────────────────────

export function workoutTotals(workout, unit) {
  let sets = 0;
  let volume = 0;
  let rpeSum = 0;
  let rpeCount = 0;
  for (const entry of workout.entries) {
    for (const s of workSets(entry)) {
      sets += 1;
      volume += convert(s.weight, workout.unit || unit, unit) * num(s.reps);
      if (s.rpe) {
        rpeSum += num(s.rpe);
        rpeCount += 1;
      }
    }
  }
  const minutes = workout.finishedAt
    ? Math.max(1, Math.round((new Date(workout.finishedAt) - new Date(workout.startedAt)) / 60000))
    : 0;
  return { sets, volume, minutes, avgRpe: rpeCount ? rpeSum / rpeCount : null };
}

export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function workoutsInWeek(state, start) {
  const end = addDays(start, 7);
  return finishedWorkouts(state).filter((w) => {
    const t = new Date(w.startedAt);
    return t >= start && t < end;
  });
}

// Consecutive weeks, counting back from this one, with at least one session.
// The current week does not break a streak if it is still empty.
export function weekStreak(state, now = new Date()) {
  let start = weekStart(now);
  let streak = 0;
  if (!workoutsInWeek(state, start).length) start = addDays(start, -7);
  while (workoutsInWeek(state, start).length) {
    streak += 1;
    start = addDays(start, -7);
  }
  return streak;
}

export function weeklyCounts(state, weeks = 8, now = new Date()) {
  const out = [];
  let start = addDays(weekStart(now), -7 * (weeks - 1));
  for (let i = 0; i < weeks; i += 1) {
    out.push({ start, count: workoutsInWeek(state, start).length });
    start = addDays(start, 7);
  }
  return out;
}

export function setsByPattern(state, start) {
  const totals = {};
  for (const w of workoutsInWeek(state, start)) {
    for (const entry of w.entries) {
      const n = workSets(entry).length;
      if (n) totals[entry.pattern] = (totals[entry.pattern] || 0) + n;
    }
  }
  return totals;
}

export function compact(n) {
  const v = Math.round(n);
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e4) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toLocaleString('en-US');
}
