// Rest timer: a floating bar that counts down after each set.
// It lives outside the routed view so redraws never reset it.

import { fmtClock, h } from '../dom.js';
import { getState } from '../store.js';

let el = null;
let timeEl = null;
let labelEl = null;
let fillEl = null;
let endsAt = 0;
let total = 0;
let ticker = null;
let hideTimer = null;
let audio = null;

function build() {
  timeEl = h('div', { class: 'rest-time' }, '0:00');
  labelEl = h('div', { class: 'rest-label' }, 'Rest');
  fillEl = h('div', { class: 'restbar-fill' });
  el = h(
    'div',
    { class: 'restbar', role: 'timer', 'aria-label': 'Rest timer' },
    h(
      'div',
      { class: 'restbar-inner' },
      h('div', { class: 'grow' }, labelEl, timeEl),
      h('button', { class: 'rest-btn', 'aria-label': 'Subtract 15 seconds', onclick: () => adjustRest(-15) }, '−15'),
      h('button', { class: 'rest-btn', 'aria-label': 'Add 15 seconds', onclick: () => adjustRest(15) }, '+15'),
      h('button', { class: 'rest-btn', onclick: () => stopRest() }, 'Skip'),
      fillEl,
    ),
  );
  document.body.append(el);
}

// Browsers only allow sound after a tap, so the audio context is created
// inside the tap that starts the timer.
function primeAudio() {
  if (!getState().settings.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audio) audio = new Ctx();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    audio = null;
  }
}

function chime() {
  const { sound, vibrate } = getState().settings;
  if (vibrate && navigator.vibrate) navigator.vibrate([180, 90, 180]);
  if (!sound || !audio) return;
  try {
    const now = audio.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch {
    // Sound is a nicety; never let it break the timer.
  }
}

function paint() {
  const left = (endsAt - Date.now()) / 1000;
  if (left <= 0) {
    finish();
    return;
  }
  timeEl.textContent = fmtClock(Math.ceil(left));
  fillEl.style.width = `${Math.max(0, Math.min(100, (1 - left / total) * 100))}%`;
}

function finish() {
  clearInterval(ticker);
  ticker = null;
  endsAt = 0;
  el.classList.add('done');
  labelEl.textContent = 'Rest over';
  timeEl.textContent = 'Go';
  fillEl.style.width = '100%';
  chime();
  hideTimer = setTimeout(hide, 4000);
}

function hide() {
  if (!el) return;
  el.classList.remove('show', 'done');
  document.body.classList.remove('resting');
}

export function startRest(seconds) {
  if (!seconds || seconds <= 0) return;
  if (!el) build();
  primeAudio();
  clearTimeout(hideTimer);
  clearInterval(ticker);
  total = seconds;
  endsAt = Date.now() + seconds * 1000;
  el.classList.remove('done');
  labelEl.textContent = 'Rest';
  el.classList.add('show');
  document.body.classList.add('resting');
  paint();
  ticker = setInterval(paint, 250);
}

export function adjustRest(delta) {
  if (!endsAt) return;
  endsAt += delta * 1000;
  total = Math.max(total + delta, 1);
  paint();
}

export function stopRest() {
  clearInterval(ticker);
  clearTimeout(hideTimer);
  ticker = null;
  endsAt = 0;
  hide();
}

export function isResting() {
  return endsAt > 0;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && endsAt) paint();
});
