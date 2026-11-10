// Small DOM toolkit: element builder, icons, bottom sheets, toasts, formatters.

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'path', 'circle', 'line', 'rect', 'g', 'text', 'polyline', 'defs', 'linearGradient', 'stop', 'title']);
const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'textContent', 'hidden', 'open']);

function append(parent, child) {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    for (const c of child) append(parent, c);
    return;
  }
  parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

// h('button', { class: 'btn', onclick: fn }, 'Label')
export function h(tag, props, ...children) {
  const el = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (PROPS.has(key)) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

// ── Icons ──────────────────────────────────────────────────────────────────
// Static, trusted markup only. Never interpolate user text into these.

const ICONS = {
  today: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  progress: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  settings: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 12 4 4-4 4"/><path d="M21 16H7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  eye: '<path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3 3.4M6.5 7.6A15 15 0 0 0 3 12s4 6 9 6a9 9 0 0 0 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  spark: '<path d="m11 3 1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
  note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
};

export function icon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon');
  svg.innerHTML = ICONS[name] || '';
  return svg;
}

// ── Bottom sheets ──────────────────────────────────────────────────────────

const openSheets = [];

export function openSheet({ title, subtitle, body, onClose } = {}) {
  const bodyEl = h('div', { class: 'sheet-body' }, body);
  const sheet = h(
    'div',
    { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Dialog' },
    h('div', { class: 'sheet-grab', 'aria-hidden': 'true' }),
    h(
      'header',
      { class: 'sheet-head' },
      h('div', { class: 'sheet-titles' }, h('h2', {}, title || ''), subtitle ? h('p', {}, subtitle) : null),
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => api.close() }, icon('close')),
    ),
    bodyEl,
  );
  const overlay = h('div', { class: 'overlay', onclick: (e) => e.target === overlay && api.close() }, sheet);
  let closed = false;

  const api = {
    el: sheet,
    setBody(node) {
      const top = bodyEl.scrollTop;
      bodyEl.replaceChildren(node);
      bodyEl.scrollTop = top;
    },
    close(result) {
      if (closed) return;
      closed = true;
      openSheets.splice(openSheets.indexOf(api), 1);
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 220);
      if (!openSheets.length) document.body.classList.remove('locked');
      if (onClose) onClose(result);
    },
  };

  openSheets.push(api);
  document.body.classList.add('locked');
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  return api;
}

export function closeAllSheets() {
  for (const s of [...openSheets]) s.close();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openSheets.length) openSheets[openSheets.length - 1].close();
});

export function confirmSheet({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let answer = false;
    const sheet = openSheet({
      title,
      body: h(
        'div',
        { class: 'stack' },
        message ? h('p', { class: 'muted' }, message) : null,
        h(
          'div',
          { class: 'btn-row' },
          h('button', { class: 'btn btn-ghost', onclick: () => sheet.close() }, cancelLabel),
          h(
            'button',
            {
              class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
              onclick: () => {
                answer = true;
                sheet.close();
              },
            },
            confirmLabel,
          ),
        ),
      ),
      onClose: () => resolve(answer),
    });
  });
}

// A list of tappable actions.
export function actionSheet({ title, subtitle, actions }) {
  const sheet = openSheet({
    title,
    subtitle,
    body: h(
      'div',
      { class: 'action-list' },
      actions.filter(Boolean).map((a) =>
        h(
          'button',
          {
            class: `action ${a.danger ? 'danger' : ''}`,
            onclick: () => {
              sheet.close();
              a.run();
            },
          },
          a.icon ? icon(a.icon) : null,
          h('span', {}, a.label),
        ),
      ),
    ),
  });
  return sheet;
}

// ── Toasts ─────────────────────────────────────────────────────────────────

let toastTimer = null;

export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function fmtDate(date, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', opts).format(new Date(date));
}

export function fmtDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hrs} h ${rest} min` : `${hrs} h`;
}

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function relativeDay(date, now = new Date()) {
  const a = new Date(date);
  const b = new Date(now);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return fmtDate(date, { month: 'short', day: 'numeric' });
}
