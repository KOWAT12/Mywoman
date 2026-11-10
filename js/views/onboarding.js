// First-run setup: a few choices that shape the program.

import { EQUIPMENT } from '../data/exercises.js';
import { h, icon } from '../dom.js';
import { completeOnboarding, DEFAULT_SETTINGS } from '../store.js';

export const EXPERIENCE = [
  { value: 1, label: 'New to lifting', note: 'Foundational variations, easy to learn.' },
  { value: 2, label: 'Some experience', note: 'Barbell basics are fair game.' },
  { value: 3, label: 'Experienced', note: 'Everything, including advanced lifts.' },
];

export function renderOnboarding() {
  const draft = {
    name: '',
    unit: DEFAULT_SETTINGS.unit,
    experience: DEFAULT_SETTINGS.experience,
    equipment: [...DEFAULT_SETTINGS.equipment],
  };

  const root = h('div', { class: 'onboard' });

  const draw = () => {
    root.replaceChildren(
      h(
        'div',
        { class: 'wordmark' },
        'Clave',
        h('span', { class: 'beats', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i', { class: 'gap' }), h('i')),
      ),
      h(
        'div',
        { class: 'stack-sm' },
        h('h1', {}, 'Strength with rhythm.'),
        h(
          'p',
          { class: 'lede' },
          'A four-day upper/lower split built on seven core movements. Clave picks a variation for each, tracks every set, and suggests a new variation when it is time for one.',
        ),
      ),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'ob-name' }, 'Your name'),
        h('input', {
          id: 'ob-name',
          class: 'input',
          type: 'text',
          autocomplete: 'given-name',
          placeholder: 'Optional',
          value: draft.name,
          oninput: (e) => {
            draft.name = e.target.value;
          },
        }),
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'Weights in'),
        h(
          'div',
          { class: 'seg' },
          ['lb', 'kg'].map((u) =>
            h(
              'button',
              {
                'aria-pressed': String(draft.unit === u),
                onclick: () => {
                  draft.unit = u;
                  draw();
                },
              },
              u === 'lb' ? 'Pounds' : 'Kilograms',
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'Time in the weight room'),
        h(
          'div',
          { class: 'stack-sm' },
          EXPERIENCE.map((opt) =>
            h(
              'button',
              {
                class: 'toggle',
                style: { minHeight: '58px' },
                'aria-pressed': String(draft.experience === opt.value),
                onclick: () => {
                  draft.experience = opt.value;
                  draw();
                },
              },
              h('span', { class: 'tick' }, icon('check', 12)),
              h('span', {}, h('div', {}, opt.label), h('div', { class: 'small muted', style: { fontWeight: '500' } }, opt.note)),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'Equipment you can use'),
        h(
          'div',
          { class: 'toggle-grid' },
          EQUIPMENT.map((eq) =>
            h(
              'button',
              {
                class: 'toggle',
                'aria-pressed': String(draft.equipment.includes(eq.id)),
                onclick: () => {
                  const i = draft.equipment.indexOf(eq.id);
                  if (i >= 0) draft.equipment.splice(i, 1);
                  else draft.equipment.push(eq.id);
                  draw();
                },
              },
              h('span', { class: 'tick' }, icon('check', 12)),
              eq.name,
            ),
          ),
        ),
        h('p', { class: 'small muted' }, 'Bodyweight movements are always included. You can change all of this later.'),
      ),
      h(
        'button',
        {
          class: 'btn btn-primary btn-block',
          onclick: () => {
            completeOnboarding({ ...draft, name: draft.name.trim() });
            window.scrollTo(0, 0);
          },
        },
        'Build my program',
      ),
    );
  };

  draw();
  return root;
}
