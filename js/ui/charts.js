// Two small SVG charts, drawn to the width of their container.
//
//   lineChart    one series over time: 2px line, soft area, end label,
//                crosshair and tooltip that snap to the nearest session.
//   columnChart  a handful of thin columns with a tooltip per column.
//
// Values are also listed in tables on the page, so the tooltip never holds
// information that cannot be read elsewhere.

import { h } from '../dom.js';

function niceTicks(min, max, count = 4) {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function fmtTick(v) {
  return Number.isInteger(v) ? v.toLocaleString('en-US') : String(v);
}

// Draw now and again whenever the container changes width.
function responsive(host, draw) {
  let lastWidth = 0;
  const run = () => {
    const width = host.clientWidth;
    if (!width || width === lastWidth) return;
    lastWidth = width;
    draw(width);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(run).observe(host);
  requestAnimationFrame(run);
  return host;
}

function placeTip(host, tip, x, y) {
  tip.classList.add('show');
  const w = tip.offsetWidth;
  const left = Math.max(0, Math.min(host.clientWidth - w, x - w / 2));
  const top = Math.max(0, y - tip.offsetHeight - 12);
  tip.style.transform = `translate(${left}px, ${top}px)`;
}

// points: [{ t: Date, value: number, label: string }] oldest first
export function lineChart({ points, format = fmtTick, summary = '' }) {
  const host = h('div', { class: 'chart' });
  const tip = h('div', { class: 'chart-tip' });

  return responsive(host, (width) => {
    const height = 200;
    const m = { top: 30, right: 16, bottom: 24, left: 40 }; // headroom for the end label
    const values = points.map((p) => p.value);
    const ticks = niceTicks(Math.min(...values), Math.max(...values));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const t0 = points[0].t.getTime();
    const t1 = points[points.length - 1].t.getTime();
    const plotW = width - m.left - m.right;
    const plotH = height - m.top - m.bottom;
    const x = (p) => (t1 === t0 ? m.left + plotW / 2 : m.left + ((p.t.getTime() - t0) / (t1 - t0)) * plotW);
    const y = (v) => m.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const base = m.top + plotH;

    const coords = points.map((p) => [x(p), y(p.value)]);
    const line = coords.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${base} L${coords[0][0].toFixed(1)} ${base} Z`;

    const crosshair = h('line', { class: 'crosshair', y1: m.top, y2: base, x1: 0, x2: 0, visibility: 'hidden' });
    const focusDot = h('circle', { class: 'series-dot', r: 5, visibility: 'hidden' });
    const showDots = points.length <= 12;
    const last = coords[coords.length - 1];
    const lastPoint = points[points.length - 1];
    const endLabelLeft = last[0] > width - 70;

    const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const xLabels = [];
    if (points.length > 1 && t1 !== t0) {
      xLabels.push(h('text', { x: m.left, y: height - 6, 'text-anchor': 'start' }, dateFmt.format(points[0].t)));
      xLabels.push(h('text', { x: width - m.right, y: height - 6, 'text-anchor': 'end' }, dateFmt.format(lastPoint.t)));
    } else {
      xLabels.push(h('text', { x: last[0], y: height - 6, 'text-anchor': 'middle' }, dateFmt.format(lastPoint.t)));
    }

    const select = (i) => {
      const [px, py] = coords[i];
      crosshair.setAttribute('x1', px);
      crosshair.setAttribute('x2', px);
      crosshair.setAttribute('visibility', 'visible');
      focusDot.setAttribute('cx', px);
      focusDot.setAttribute('cy', py);
      focusDot.setAttribute('visibility', 'visible');
      tip.replaceChildren(h('b', {}, format(points[i].value)), points[i].label);
      placeTip(host, tip, px, py);
    };
    const clear = () => {
      crosshair.setAttribute('visibility', 'hidden');
      focusDot.setAttribute('visibility', 'hidden');
      tip.classList.remove('show');
    };
    const nearest = (clientX, rect) => {
      const px = clientX - rect.left;
      let best = 0;
      for (let i = 1; i < coords.length; i += 1) {
        if (Math.abs(coords[i][0] - px) < Math.abs(coords[best][0] - px)) best = i;
      }
      return best;
    };
    let active = points.length - 1;

    const svg = h(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        height,
        role: 'img',
        tabindex: '0',
        'aria-label': summary,
        onpointermove: (e) => {
          active = nearest(e.clientX, svg.getBoundingClientRect());
          select(active);
        },
        onpointerdown: (e) => {
          active = nearest(e.clientX, svg.getBoundingClientRect());
          select(active);
        },
        onpointerleave: (e) => e.pointerType === 'mouse' && clear(),
        onfocus: () => select(active),
        onblur: clear,
        onkeydown: (e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          active = Math.max(0, Math.min(points.length - 1, active + (e.key === 'ArrowRight' ? 1 : -1)));
          select(active);
        },
      },
      ticks.map((t) => [
        h('line', { class: t === yMin ? 'axis' : 'grid', x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) }),
        h('text', { x: m.left - 8, y: y(t) + 4, 'text-anchor': 'end' }, fmtTick(t)),
      ]),
      points.length > 1 ? h('path', { class: 'series-area', d: area }) : null,
      points.length > 1 ? h('path', { class: 'series-line', d: line }) : null,
      crosshair,
      showDots ? coords.slice(0, -1).map(([px, py]) => h('circle', { class: 'series-dot', cx: px, cy: py, r: 4 })) : null,
      h('circle', { class: 'series-dot', cx: last[0], cy: last[1], r: 5 }),
      h(
        'text',
        {
          class: 'label-strong',
          x: endLabelLeft ? last[0] - 10 : last[0] + 10,
          y: last[1] - 12,
          'text-anchor': endLabelLeft ? 'end' : 'start',
        },
        format(lastPoint.value),
      ),
      focusDot,
      xLabels,
    );

    host.replaceChildren(svg, tip);
  });
}

// items: [{ label, value, tip }]. `floor` keeps the scale honest when every
// value is small: one session should not fill the chart.
export function columnChart({ items, summary = '', unit = '', floor = 1 }) {
  const host = h('div', { class: 'chart' });
  const tip = h('div', { class: 'chart-tip' });

  return responsive(host, (width) => {
    const height = 150;
    const m = { top: 10, right: 8, bottom: 24, left: 28 };
    const max = Math.max(floor, ...items.map((i) => i.value));
    const ticks = niceTicks(0, max, 3).filter((t) => Number.isInteger(t));
    const yMax = ticks[ticks.length - 1];
    const plotW = width - m.left - m.right;
    const plotH = height - m.top - m.bottom;
    const band = plotW / items.length;
    const barW = Math.min(24, band - 8);
    const base = m.top + plotH;
    const y = (v) => m.top + (1 - v / yMax) * plotH;
    const skip = Math.ceil(items.length / Math.max(1, Math.floor(plotW / 56)));

    const svg = h(
      'svg',
      { viewBox: `0 0 ${width} ${height}`, height, role: 'group', 'aria-label': summary },
      ticks.map((t) => [
        h('line', { class: t === 0 ? 'axis' : 'grid', x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) }),
        h('text', { x: m.left - 8, y: y(t) + 4, 'text-anchor': 'end' }, fmtTick(t)),
      ]),
      items.map((item, i) => {
        const cx = m.left + band * i + band / 2;
        const top = y(item.value);
        const hgt = base - top;
        const r = Math.min(4, hgt / 2, barW / 2);
        // Rounded at the data end, square on the baseline.
        const d = `M${cx - barW / 2} ${base} V${top + r} Q${cx - barW / 2} ${top} ${cx - barW / 2 + r} ${top} H${cx + barW / 2 - r} Q${cx + barW / 2} ${top} ${cx + barW / 2} ${top + r} V${base} Z`;
        const show = () => {
          tip.replaceChildren(h('b', {}, `${item.value}${unit ? ` ${unit}` : ''}`), item.tip);
          placeTip(host, tip, cx, Math.min(top, base - 8));
        };
        const hide = () => tip.classList.remove('show');
        return [
          item.value > 0 ? h('path', { class: 'series-bar', d }) : null,
          (items.length - 1 - i) % skip === 0
            ? h('text', { x: cx, y: height - 6, 'text-anchor': 'middle' }, item.label)
            : null,
          h('rect', {
            class: 'hit',
            x: cx - band / 2,
            y: m.top,
            width: band,
            height: plotH,
            tabindex: '0',
            role: 'img',
            'aria-label': `${item.tip}: ${item.value}${unit ? ` ${unit}` : ''}`,
            onpointerenter: show,
            onpointerdown: show,
            onpointerleave: (e) => e.pointerType === 'mouse' && hide(),
            onfocus: show,
            onblur: hide,
          }),
        ];
      }),
    );

    host.replaceChildren(svg, tip);
  });
}
