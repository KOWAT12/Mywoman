// Settings: profile, equipment, timers, appearance and backup.

import { EQUIPMENT } from '../data/exercises.js';
import { confirmSheet, h, icon, toast } from '../dom.js';
import { exportData, getState, importData, resetAll, update } from '../store.js';
import { EXPERIENCE } from './onboarding.js';

function setting(title, sub, control) {
  return h(
    'div',
    { class: 'setting' },
    h('div', { class: 'grow' }, h('div', { class: 'setting-title' }, title), sub ? h('div', { class: 'setting-sub' }, sub) : null),
    control,
  );
}

function toggle(key, label) {
  const { settings } = getState();
  return h('button', {
    class: 'switch',
    role: 'switch',
    'aria-checked': String(Boolean(settings[key])),
    'aria-label': label,
    onclick: () => update((s) => (s.settings[key] = !s.settings[key])),
  });
}

function stepper(key, { min, max, step, format, label }) {
  const { settings } = getState();
  const set = (v) => update((s) => (s.settings[key] = Math.max(min, Math.min(max, v))));
  return h(
    'div',
    { class: 'stepper', role: 'group', 'aria-label': label },
    h('button', { 'aria-label': `Decrease ${label}`, onclick: () => set(settings[key] - step) }, icon('minus', 18)),
    h('output', {}, format(settings[key])),
    h('button', { 'aria-label': `Increase ${label}`, onclick: () => set(settings[key] + step) }, icon('plus', 18)),
  );
}

function seg(key, options, label) {
  const { settings } = getState();
  return h(
    'div',
    { class: 'seg', role: 'group', 'aria-label': label },
    options.map(([value, text]) =>
      h('button', { 'aria-pressed': String(settings[key] === value), onclick: () => update((s) => (s.settings[key] = value)) }, text),
    ),
  );
}

const fmtRest = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function download() {
  const blob = new Blob([exportData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `clave-backup-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup downloaded');
}

function restore(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    confirmSheet({
      title: 'Replace everything with this backup?',
      message: 'Your current history, plan and settings will be overwritten.',
      confirmLabel: 'Restore',
      danger: true,
    }).then((yes) => {
      if (!yes) return;
      try {
        importData(String(reader.result));
        toast('Backup restored');
      } catch (err) {
        toast(err.message || 'That file could not be read');
      }
    });
  };
  reader.readAsText(file);
}

export function renderSettings() {
  const state = getState();
  const { settings } = state;
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'sr-only',
    tabindex: '-1',
    'aria-hidden': 'true',
    onchange: (e) => {
      restore(e.target.files[0]);
      e.target.value = '';
    },
  });

  return h(
    'div',
    { class: 'view' },
    h('a', { class: 'back-link', href: '#/today' }, icon('left', 20), 'Today'),
    h('h1', { class: 'page-title' }, 'Settings'),

    h('div', { class: 'section-title' }, 'You'),
    h(
      'div',
      { class: 'list' },
      h(
        'div',
        { class: 'setting col' },
        h('label', { class: 'setting-title', for: 'set-name' }, 'Name'),
        h('input', {
          id: 'set-name',
          class: 'input',
          type: 'text',
          autocomplete: 'given-name',
          placeholder: 'Optional',
          value: settings.name,
          oninput: (e) => update((s) => (s.settings.name = e.target.value.trimStart()), { render: false }),
        }),
      ),
      h('div', { class: 'setting col' }, h('div', { class: 'setting-title' }, 'Units'), seg('unit', [['lb', 'Pounds'], ['kg', 'Kilograms']], 'Units')),
      h(
        'div',
        { class: 'setting col' },
        h('div', {}, h('div', { class: 'setting-title' }, 'Experience'), h('div', { class: 'setting-sub' }, 'Sets how advanced the recommended variations are.')),
        seg('experience', EXPERIENCE.map((e) => [e.value, e.label.replace(' to lifting', '').replace(' experience', '')]), 'Experience'),
      ),
      setting('Weekly goal', 'Sessions per week', stepper('weeklyGoal', { min: 1, max: 7, step: 1, format: String, label: 'weekly goal' })),
    ),

    h('div', { class: 'section-title' }, 'Equipment'),
    h(
      'div',
      { class: 'card flat stack' },
      h(
        'div',
        { class: 'toggle-grid' },
        EQUIPMENT.map((eq) =>
          h(
            'button',
            {
              class: 'toggle',
              'aria-pressed': String(settings.equipment.includes(eq.id)),
              onclick: () =>
                update((s) => {
                  const i = s.settings.equipment.indexOf(eq.id);
                  if (i >= 0) s.settings.equipment.splice(i, 1);
                  else s.settings.equipment.push(eq.id);
                }),
            },
            h('span', { class: 'tick' }, icon('check', 12)),
            eq.name,
          ),
        ),
      ),
      h('p', { class: 'small muted' }, 'Recommendations only use what is ticked. If a movement in your plan needs something you unticked, Today will offer a swap.'),
    ),

    h('div', { class: 'section-title' }, 'Program'),
    h(
      'div',
      { class: 'list' },
      h(
        'a',
        { class: 'list-item', href: '#/program' },
        h('span', { class: 'badge' }, icon('list', 18)),
        h('span', { class: 'grow' }, h('div', { class: 'li-title' }, 'Edit the split'), h('div', { class: 'li-sub' }, `${state.program.length} days · sets, reps, RPE and variations`)),
        icon('right', 18),
      ),
    ),

    h('div', { class: 'section-title' }, 'During a workout'),
    h(
      'div',
      { class: 'list' },
      setting('Rest, core movements', 'Squat, hinge, push and pull', stepper('restMain', { min: 30, max: 300, step: 15, format: fmtRest, label: 'rest for core movements' })),
      setting('Rest, accessories', 'Everything else', stepper('restAccessory', { min: 15, max: 300, step: 15, format: fmtRest, label: 'rest for accessories' })),
      setting('Ask for RPE after each set', 'Opens the effort scale when a set is checked off', toggle('askRpe', 'Ask for RPE after each set')),
      setting('Sound when rest ends', null, toggle('sound', 'Sound when rest ends')),
      setting('Vibrate when rest ends', 'On phones that support it', toggle('vibrate', 'Vibrate when rest ends')),
    ),

    h('div', { class: 'section-title' }, 'Appearance'),
    h('div', { class: 'card flat' }, seg('theme', [['auto', 'Match phone'], ['light', 'Light'], ['dark', 'Dark']], 'Theme')),

    h('div', { class: 'section-title' }, 'Your data'),
    h(
      'div',
      { class: 'card flat stack' },
      h('p', { class: 'small muted' }, 'Everything is stored on this device only. Download a backup now and then, and before switching phones.'),
      h(
        'div',
        { class: 'btn-row' },
        h('button', { class: 'btn btn-ghost', onclick: download }, icon('download', 18), 'Back up'),
        h('button', { class: 'btn btn-ghost', onclick: () => fileInput.click() }, icon('upload', 18), 'Restore'),
      ),
      fileInput,
      h(
        'button',
        {
          class: 'btn-text',
          style: { color: 'var(--danger)', alignSelf: 'center' },
          onclick: () =>
            confirmSheet({
              title: 'Erase everything?',
              message: 'All sessions, your plan and settings will be deleted from this device. This cannot be undone.',
              confirmLabel: 'Erase',
              danger: true,
            }).then((yes) => {
              if (!yes) return;
              resetAll();
              location.hash = '#/today';
            }),
        },
        'Erase all data',
      ),
    ),

    h(
      'p',
      { class: 'small muted', style: { textAlign: 'center' } },
      'To install: open the browser menu and choose Add to Home Screen.',
    ),
  );
}
