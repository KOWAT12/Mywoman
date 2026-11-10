// The movement library: every pattern and its variations.

import { EQUIPMENT, PATTERNS, PATTERN_GROUPS } from '../data/exercises.js';
import { confirmSheet, h, icon, openSheet, toast } from '../dom.js';
import { exercisesForPattern, isAvailable } from '../logic/library.js';
import { allTimeBests, fmtWeight } from '../logic/stats.js';
import { addCustomExercise, deleteCustomExercise, getState, toggleFavorite, toggleHidden } from '../store.js';
import { exerciseMeta } from '../ui/pickers.js';

export function renderLibrary() {
  const state = getState();
  return h(
    'div',
    { class: 'view' },
    h(
      'div',
      {},
      h('h1', { class: 'page-title' }, 'Movements'),
      h('p', { class: 'muted' }, 'Every pattern in the split, and the variations Clave can recommend for it.'),
    ),
    PATTERN_GROUPS.map((group) => [
      h('div', {}, h('div', { class: 'section-title' }, group.title), h('div', { class: 'small muted' }, group.note)),
      h(
        'div',
        { class: 'list' },
        Object.entries(PATTERNS)
          .filter(([, p]) => p.tier === group.tier)
          .map(([id, p]) => {
            const pool = exercisesForPattern(state, id);
            const usable = pool.filter((ex) => isAvailable(ex, state.settings)).length;
            return h(
              'a',
              { class: 'list-item', href: `#/library/${id}` },
              h('span', { class: `badge ${p.region}` }, String(usable)),
              h('span', { class: 'grow' }, h('div', { class: 'li-title' }, p.name), h('div', { class: 'li-sub' }, p.blurb)),
              icon('right', 18),
            );
          }),
      ),
    ]),
  );
}

function customForm(pattern) {
  const draft = { name: '', equip: 'dumbbell', level: 1, uni: false, timed: false, bw: false };
  let sheet;
  const flag = (key, label) => {
    const btn = h(
      'button',
      {
        class: 'toggle',
        'aria-pressed': 'false',
        onclick: () => {
          draft[key] = !draft[key];
          btn.setAttribute('aria-pressed', String(draft[key]));
        },
      },
      h('span', { class: 'tick' }, icon('check', 12)),
      label,
    );
    return btn;
  };
  const nameInput = h('input', {
    id: 'cx-name',
    class: 'input',
    type: 'text',
    maxlength: '60',
    placeholder: 'e.g. Zercher Squat',
    oninput: (e) => {
      draft.name = e.target.value;
    },
  });

  sheet = openSheet({
    title: 'Add your own variation',
    subtitle: PATTERNS[pattern].name,
    body: h(
      'div',
      { class: 'stack' },
      h('div', { class: 'field' }, h('label', { for: 'cx-name' }, 'Name'), nameInput),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'cx-equip' }, 'Equipment'),
        h(
          'select',
          {
            id: 'cx-equip',
            class: 'select',
            onchange: (e) => {
              draft.equip = e.target.value;
            },
          },
          [...EQUIPMENT, { id: 'bodyweight', name: 'Bodyweight' }].map((eq) =>
            h('option', { value: eq.id, selected: eq.id === draft.equip }, eq.name),
          ),
        ),
      ),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'cx-level' }, 'Difficulty'),
        h(
          'select',
          {
            id: 'cx-level',
            class: 'select',
            onchange: (e) => {
              draft.level = Number(e.target.value);
            },
          },
          [
            [1, 'Foundational'],
            [2, 'Intermediate'],
            [3, 'Advanced'],
          ].map(([value, label]) => h('option', { value }, label)),
        ),
      ),
      h('div', { class: 'stack-sm' }, flag('uni', 'One side at a time'), flag('bw', 'Bodyweight (added load optional)'), flag('timed', 'Timed hold, logged in seconds')),
      h(
        'button',
        {
          class: 'btn btn-primary btn-block',
          onclick: () => {
            const name = draft.name.trim();
            if (!name) {
              toast('Give it a name first');
              nameInput.focus();
              return;
            }
            addCustomExercise({ ...draft, name, pattern, cue: '' });
            sheet.close();
            toast(`${name} added`);
          },
        },
        'Add to library',
      ),
    ),
  });
}

export function renderPattern({ params }) {
  const state = getState();
  const id = params[0];
  const pattern = PATTERNS[id];
  if (!pattern) return renderLibrary();
  const unit = state.settings.unit;
  const pool = exercisesForPattern(state, id)
    .slice()
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const inProgram = new Set(state.program.flatMap((d) => d.slots.map((s) => s.exerciseId)));

  return h(
    'div',
    { class: 'view' },
    h('a', { class: 'back-link', href: '#/library' }, icon('left', 20), 'Movements'),
    h(
      'div',
      {},
      h('div', { class: 'eyebrow' }, pattern.tier === 'core' ? 'Core movement' : pattern.tier === 'trunk' ? 'Abs & trunk' : 'Accessory'),
      h('h1', { class: 'page-title' }, pattern.name),
      h('p', { class: 'muted' }, pattern.blurb),
    ),
    pool.map((ex) => {
      const fav = state.favorites.includes(ex.id);
      const hidden = state.hidden.includes(ex.id);
      const available = isAvailable(ex, state.settings);
      const bests = allTimeBests(state, ex.id);
      const best =
        bests.sessions === 0
          ? null
          : bests.weight > 0
            ? `Logged ${bests.sessions}× · best ${fmtWeight(bests.weight)} ${unit}`
            : ex.timed
              ? `Logged ${bests.sessions}× · best ${bests.time} s`
              : `Logged ${bests.sessions}× · best ${bests.reps} reps`;
      return h(
        'div',
        { class: 'card flat', style: hidden ? { opacity: '0.6' } : null },
        h(
          'div',
          { class: 'row', style: { alignItems: 'flex-start' } },
          h(
            'div',
            { class: 'grow' },
            h('div', { class: 'card-title', style: { fontSize: '17px' } }, ex.name),
            h('div', { class: 'var-meta' }, exerciseMeta(ex)),
            h(
              'div',
              { class: 'chips', style: { marginTop: '8px' } },
              inProgram.has(ex.id) ? h('span', { class: 'chip tiny accent' }, 'In your plan') : null,
              !available ? h('span', { class: 'chip tiny' }, 'Not in your equipment') : null,
              hidden ? h('span', { class: 'chip tiny' }, 'Never recommended') : null,
              ex.custom ? h('span', { class: 'chip tiny' }, 'Your own') : null,
            ),
          ),
          h(
            'button',
            {
              class: `icon-btn ${fav ? 'on' : ''}`,
              'aria-pressed': String(fav),
              'aria-label': fav ? `Remove ${ex.name} from favorites` : `Favorite ${ex.name}`,
              onclick: () => toggleFavorite(ex.id),
            },
            icon('heart', 20),
          ),
          h(
            'button',
            {
              class: 'icon-btn',
              'aria-pressed': String(hidden),
              'aria-label': hidden ? `Allow ${ex.name} in recommendations` : `Never recommend ${ex.name}`,
              onclick: () => {
                toggleHidden(ex.id);
                toast(hidden ? 'Back in recommendations' : 'Will not be recommended');
              },
            },
            icon(hidden ? 'eyeOff' : 'eye', 20),
          ),
        ),
        ex.cue ? h('p', { class: 'var-note' }, ex.cue) : null,
        ex.dance ? h('p', { class: 'var-note' }, h('strong', { style: { color: 'var(--text)' } }, 'On the dance floor: '), ex.dance) : null,
        best || ex.custom
          ? h(
              'div',
              { class: 'row between', style: { marginTop: '8px' } },
              best ? h('a', { class: 'btn-text', href: `#/progress/${ex.id}`, style: { textDecoration: 'none', paddingLeft: '0' } }, best) : h('span'),
              ex.custom
                ? h(
                    'button',
                    {
                      class: 'btn-text',
                      style: { color: 'var(--danger)' },
                      onclick: () =>
                        confirmSheet({
                          title: `Delete ${ex.name}?`,
                          message: 'Sessions already logged keep their sets.',
                          confirmLabel: 'Delete',
                          danger: true,
                        }).then((yes) => yes && deleteCustomExercise(ex.id)),
                    },
                    'Delete',
                  )
                : null,
            )
          : null,
      );
    }),
    h('button', { class: 'btn btn-outline btn-block', onclick: () => customForm(id) }, icon('plus', 18), 'Add your own variation'),
  );
}
