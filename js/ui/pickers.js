// Shared pickers: RPE, variation, and movement pattern.

import { EQUIP_LABEL, LEVEL_LABEL, PATTERNS, PATTERN_GROUPS } from '../data/exercises.js';
import { h, icon, openSheet, relativeDay } from '../dom.js';
import { rankVariations } from '../logic/recommend.js';
import { exerciseHistory, summarizeSets } from '../logic/stats.js';

// ── RPE ────────────────────────────────────────────────────────────────────

export const RPE_SCALE = [
  [5, 'Easy, warm-up effort'],
  [6, '4 reps left'],
  [6.5, '3 to 4 reps left'],
  [7, '3 reps left'],
  [7.5, '2 to 3 reps left'],
  [8, '2 reps left'],
  [8.5, '1 to 2 reps left'],
  [9, '1 rep left'],
  [9.5, 'Maybe one more'],
  [10, 'Nothing left'],
];

export function pickRpe({ current = null, title = 'How hard was that set?', onPick }) {
  const sheet = openSheet({
    title,
    subtitle: 'RPE: how many more reps you could have done.',
    body: h(
      'div',
      { class: 'stack' },
      h(
        'div',
        { class: 'rpe-grid' },
        RPE_SCALE.map(([value, desc]) =>
          h(
            'button',
            {
              class: 'rpe-option',
              'aria-pressed': String(current === value),
              onclick: () => {
                sheet.close();
                onPick(value);
              },
            },
            h('span', { class: 'n' }, String(value)),
            h('span', { class: 'd' }, desc),
          ),
        ),
      ),
      current
        ? h(
            'button',
            {
              class: 'btn btn-ghost btn-block',
              onclick: () => {
                sheet.close();
                onPick(null);
              },
            },
            'Clear RPE',
          )
        : null,
    ),
  });
  return sheet;
}

// ── Variations ─────────────────────────────────────────────────────────────

export function levelDots(level) {
  return h(
    'span',
    { class: 'level', role: 'img', 'aria-label': LEVEL_LABEL[level] },
    [1, 2, 3].map((n) => h('i', { class: n <= level ? 'on' : '' })),
  );
}

export function exerciseMeta(ex) {
  const bits = [EQUIP_LABEL[ex.equip] || ex.equip, LEVEL_LABEL[ex.level]];
  if (ex.uni) bits.push('Per side');
  if (ex.timed) bits.push('Timed');
  return bits.join(' · ');
}

function variationRow(state, item, { recommended, onPick }) {
  const { ex } = item;
  const history = exerciseHistory(state, ex.id);
  const chips = [];
  if (item.isCurrent) chips.push(h('span', { class: 'chip tiny' }, 'Current'));
  if (!item.available) chips.push(h('span', { class: 'chip tiny' }, `Needs ${(EQUIP_LABEL[ex.equip] || '').toLowerCase()}`));
  if (item.inSession) chips.push(h('span', { class: 'chip tiny' }, 'Already in this session'));
  if (item.hidden) chips.push(h('span', { class: 'chip tiny' }, 'Hidden'));
  const reasons = item.reasons.filter((r) => r !== 'Done recently' || !recommended).slice(0, recommended ? 3 : 2);
  for (const reason of reasons) {
    if (item.isCurrent) break;
    chips.push(h('span', { class: `chip tiny ${recommended ? 'accent' : ''}` }, reason));
  }

  return h(
    'button',
    {
      class: `var ${recommended ? 'rec' : ''} ${item.isCurrent ? 'current' : ''} ${item.available ? '' : 'off'}`,
      onclick: () => onPick(ex),
    },
    h(
      'div',
      { class: 'grow' },
      h('div', { class: 'var-name' }, ex.name),
      h('div', { class: 'var-meta' }, exerciseMeta(ex)),
      chips.length ? h('div', { class: 'chips' }, chips) : null,
      recommended && ex.dance ? h('div', { class: 'var-note' }, ex.dance) : null,
      history.length
        ? h(
            'div',
            { class: 'var-note' },
            `${relativeDay(history[0].date)}: ${summarizeSets(history[0].sets, ex, state.settings.unit)}`,
          )
        : null,
    ),
    icon(item.isCurrent ? 'check' : 'right', 18),
  );
}

// Opens the variation sheet for a movement pattern. `onPick` receives the
// chosen exercise (never the current one).
export function pickVariation({ state, pattern, currentId = null, dayId = null, target = null, intent = null, title, subtitle, onPick }) {
  const ranked = rankVariations(state, { pattern, currentId, dayId, target, intent });
  const meta = PATTERNS[pattern];
  let sheet;
  const choose = (ex) => {
    sheet.close();
    if (ex.id !== currentId) onPick(ex);
  };

  const body = h(
    'div',
    { class: 'stack' },
    ranked.recommended.length
      ? [
          h('div', { class: 'row' }, icon('spark', 16), h('div', { class: 'eyebrow' }, 'Recommended for you')),
          h('div', { class: 'var-list' }, ranked.recommended.map((item) => variationRow(state, item, { recommended: true, onPick: choose }))),
        ]
      : h('p', { class: 'muted small' }, 'No other variations match your equipment. Everything in this pattern is listed below.'),
    ranked.others.length
      ? [
          h('div', { class: 'eyebrow', style: { marginTop: '6px' } }, 'All variations'),
          h('div', { class: 'var-list' }, ranked.others.map((item) => variationRow(state, item, { recommended: false, onPick: choose }))),
        ]
      : null,
  );

  sheet = openSheet({
    title: title || `${meta.name} variations`,
    subtitle: subtitle || meta.blurb,
    body,
  });
  return sheet;
}

// ── Patterns ───────────────────────────────────────────────────────────────

export function pickPattern({ title = 'Add a movement', onPick }) {
  let sheet;
  const body = h(
    'div',
    { class: 'stack' },
    PATTERN_GROUPS.map((group) => [
      h('div', { class: 'eyebrow' }, group.title),
      h(
        'div',
        { class: 'chips' },
        Object.entries(PATTERNS)
          .filter(([, p]) => p.tier === group.tier)
          .map(([id, p]) =>
            h(
              'button',
              {
                class: 'choice',
                onclick: () => {
                  sheet.close();
                  onPick(id);
                },
              },
              p.name,
            ),
          ),
      ),
    ]),
  );
  sheet = openSheet({ title, subtitle: 'Pick the movement, then choose a variation.', body });
  return sheet;
}
