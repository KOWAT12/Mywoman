// Entry point: routing, the tab bar, theme, and the bits that tick.

import { closeAllSheets, h, icon, toast } from './dom.js';
import { getState, isStorageOk, load, subscribe } from './store.js';
import { stopRest } from './ui/timer.js';
import { renderHistory, renderWorkoutDetail } from './views/history.js';
import { renderLibrary, renderPattern } from './views/library.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderProgram } from './views/program.js';
import { renderProgress } from './views/progress.js';
import { renderSettings } from './views/settings.js';
import { renderToday } from './views/today.js';
import { elapsedLabel, renderWorkout } from './views/workout.js';

const TABS = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'library', label: 'Movements', icon: 'dumbbell' },
];

const ROUTES = {
  today: { tab: 'today', render: renderToday },
  workout: { tab: null, render: renderWorkout },
  history: { tab: 'history', render: (ctx) => (ctx.params.length ? renderWorkoutDetail(ctx) : renderHistory(ctx)) },
  progress: { tab: 'progress', render: renderProgress },
  library: { tab: 'library', render: (ctx) => (ctx.params.length ? renderPattern(ctx) : renderLibrary(ctx)) },
  settings: { tab: 'today', render: renderSettings },
  program: { tab: 'today', render: renderProgram },
};

const app = document.getElementById('app');
let lastRoute = null;
let wakeLock = null;

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const name = ROUTES[parts[0]] ? parts[0] : 'today';
  return { name, params: parts.slice(1), key: parts.join('/') || 'today' };
}

function applyTheme() {
  const { theme } = getState().settings;
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#131016' : '#faf5f2');
}

function tabbar(current) {
  return h(
    'nav',
    { class: 'tabbar', 'aria-label': 'Main' },
    h(
      'div',
      { class: 'tabbar-inner' },
      TABS.map((tab) =>
        h(
          'a',
          { class: 'tab', href: `#/${tab.id}`, 'aria-current': tab.id === current ? 'page' : null },
          icon(tab.icon, 22),
          tab.label,
        ),
      ),
    ),
  );
}

// A slim reminder on other tabs that a session is still open.
function activeBanner(state) {
  const a = state.active;
  return h(
    'a',
    { class: 'banner', href: '#/workout', style: { textDecoration: 'none' } },
    h('span', { class: 'dot' }),
    h('span', { class: 'grow' }, h('strong', {}, a.editingId ? `Editing ${a.dayName}` : `${a.dayName} in progress`)),
    h('span', { class: 'btn-text', style: { minHeight: '32px' } }, a.editingId ? 'Continue' : 'Resume'),
  );
}

async function syncWakeLock(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator && !document.hidden) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}

function render() {
  const state = getState();
  applyTheme();

  if (!state.onboarded) {
    document.body.classList.add('no-tabs');
    app.replaceChildren(renderOnboarding());
    lastRoute = null;
    return;
  }

  const route = parseRoute();
  const def = ROUTES[route.name];
  const sameRoute = lastRoute === route.key;
  const scroll = sameRoute ? window.scrollY : 0;

  const view = def.render({ params: route.params });
  const showTabs = def.tab !== null;
  if (showTabs && state.active && route.name !== 'today') view.prepend(activeBanner(state));

  document.body.classList.toggle('no-tabs', !showTabs);
  app.replaceChildren(view, showTabs ? tabbar(def.tab) : '');
  window.scrollTo(0, scroll);
  lastRoute = route.key;

  const inSession = route.name === 'workout' && state.active && !state.active.editingId;
  syncWakeLock(Boolean(inSession));
  if (!state.active) stopRest();
}

// ── Wiring ─────────────────────────────────────────────────────────────────

load();
subscribe(render);
window.addEventListener('hashchange', () => {
  closeAllSheets();
  render();
});
window.addEventListener('clave:render', render);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && parseRoute().name === 'workout') render();
});

// Keep the session clock moving without redrawing the page.
setInterval(() => {
  const el = document.getElementById('elapsed');
  const { active } = getState();
  if (el && active) el.textContent = elapsedLabel(active);
}, 1000);

render();

if (!isStorageOk()) {
  toast('This browser is blocking storage, so sessions will not be saved.');
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
