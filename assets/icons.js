// ============================================================
// Icons — SVG stroke icons + data constants
// ============================================================

// SVG paths per icon. Use $c as placeholder for fill=color on filled elements.
const ICON_PATHS = {
  home:        `<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5h14V10"/>`,
  list:        `<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="$c" stroke="none"/><circle cx="4" cy="12" r="1" fill="$c" stroke="none"/><circle cx="4" cy="18" r="1" fill="$c" stroke="none"/>`,
  plus:        `<path d="M12 5v14M5 12h14"/>`,
  check:       `<path d="M5 12.5 10 17.5l9-10.5"/>`,
  chevronLeft: `<path d="M15 6l-6 6 6 6"/>`,
  chevronRight:`<path d="M9 6l6 6-6 6"/>`,
  chevronDown: `<path d="M6 9l6 6 6-6"/>`,
  close:       `<path d="M6 6l12 12M18 6 6 18"/>`,
  flame:       `<path d="M12 3c.5 3 3 4.5 3 8 0 2.5-1.5 5-3 5s-3-2-3-4.5c0-1.5.5-2 1.5-3-.5 2 .5 3 1 3 0-2 .5-5.5.5-8.5z"/>`,
  edit:        `<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="m14 6 4 4"/>`,
  trash:       `<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>`,
  moon:        `<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>`,
  sun:         `<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5"/>`,
  droplet:     `<path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 1 1-12 0c0-3.5 3-6.5 6-10.5z"/>`,
  book:        `<path d="M4 5c0-1 1-1.5 3-1.5S10 4 12 4s3-.5 5-.5 3 .5 3 1.5v13c0 1-1 1.5-3 1.5s-3-.5-5-.5-3 .5-5 .5-3-.5-3-1.5V5z"/><path d="M12 4v16"/>`,
  leaf:        `<path d="M4 20c2-9 7-14 16-15-1 9-6 14-15 16M4 20l7-7"/>`,
  dumbbell:    `<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>`,
  yoga:        `<circle cx="12" cy="5" r="2"/><path d="M12 7v5l-4 8M12 12l4 8M5 12h14"/>`,
  pen:         `<path d="M3 21l4-1 12-12-3-3L4 17l-1 4z"/>`,
  clock:       `<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>`,
  mail:        `<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 8 7.5 5.5L19.5 8"/>`,
  target:      `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="$c" stroke="none"/>`,
  hash:        `<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>`,
  settings:    `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z"/>`,
  sparkle:     `<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>`,
  arrow:       `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  coffee:      `<path d="M4 8h12v6a5 5 0 0 1-10 0V8zM16 9h2a2 2 0 0 1 0 4h-2M7 3v2M10 3v2M13 3v2M4 20h14"/>`,
  music:       `<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>`,
  walk:        `<circle cx="13" cy="5" r="2"/><path d="M9 21l3-7-2-3 5-3 3 4 3 1M9 14l-2-2-3 1"/>`,
  phone:       `<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>`,
  heart:       `<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>`,
  bike:        `<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1" fill="$c" stroke="none"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>`,
  bed:         `<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>`,
  headphones:  `<path d="M3 14h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3"/>`,
  star:        `<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>`,
  eye:         `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  camera:      `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
  pill:        `<path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7z"/><path d="M8.5 8.5 16 16"/>`,
  tree:        `<path d="M12 22v-8M5 18l7-8 7 8M7 12l5-6 5 6"/>`,
  wind:        `<path d="M9.6 4.6A2 2 0 1 1 11 8H2M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M12.6 19.4A2 2 0 1 0 14 16H2"/>`,
  chart:       `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  palette:     `<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.5" fill="$c" stroke="none"/><circle cx="12" cy="7.5" r="1.5" fill="$c" stroke="none"/><circle cx="15.5" cy="10.5" r="1.5" fill="$c" stroke="none"/><circle cx="14" cy="14.5" r="1.5" fill="$c" stroke="none"/>`,
  apple:       `<path d="M17 8a6 6 0 0 0-10 0c-1 2-1 7 0 9a5 5 0 0 0 10 0c1-2 1-7 0-9z"/><path d="M12 8V5M14.5 4a3 3 0 0 0-2.5 1"/>`,
  stretch:     `<circle cx="12" cy="4" r="2"/><path d="M12 6v5M9 14l3-3 3 3M7 21l2-6M17 21l-2-6"/>`,
  bowl:        `<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M3 11h18M12 19v2M9 21h6"/>`,
  cart:        `<path d="M4 5h2l1.6 9.5h9.2L19 8H7"/><circle cx="9.5" cy="19" r="1.4" fill="$c" stroke="none"/><circle cx="16.5" cy="19" r="1.4" fill="$c" stroke="none"/>`,
  users:       `<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3 2.6-5 5.5-5s5.5 2 5.5 5"/><circle cx="17.5" cy="7" r="2.3"/><path d="M16 13c2.6 0 4.5 1.8 4.5 4.5"/>`,
  copy:        `<path d="M9 9h10v10H9z"/><path d="M5 15V5h10"/>`,
  link:        `<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M13 17.5l-1 1a4 4 0 0 1-6-6l1-1"/>`,
  qr:          `<path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M14 14h2v2"/><path d="M19 14h1v6h-6v-2"/><path d="M16 18h1"/>`,
  bread:       `<path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4c0 1.1-.7 2-1.5 2.3V18h-11v-5.7C5.7 12 5 11.1 5 10z"/><path d="M10 9.5V12M13.5 9.5V12"/>`,
  milk:        `<path d="M9 3h6v3l2 4v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l2-4V3z"/><path d="M7 10h10"/>`,
  spray:       `<path d="M9 21h7v-9l-1.5-3h-4L9 12v9z"/><path d="M11 9V6h4M18 3.5h2M18 6h2M18 8.5h2"/>`,
  box:         `<path d="M4 8l8-4 8 4-8 4-8-4z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/>`,
  utensils:    `<path d="M7 3v8"/><path d="M5 3v4a2 2 0 0 0 4 0V3"/><path d="M7 11v10"/><path d="M16 3c-1.5 0-2.6 2-2.6 5s1.1 4 2.6 4v9"/>`,
  paw:         `<circle cx="7.5" cy="9" r="1.5" fill="$c" stroke="none"/><circle cx="12" cy="7.3" r="1.6" fill="$c" stroke="none"/><circle cx="16.5" cy="9" r="1.5" fill="$c" stroke="none"/><path d="M8 15.5c0-2 1.8-3 4-3s4 1 4 3-1.8 3.5-4 3.5-4-1.5-4-3.5z" fill="$c" stroke="none"/>`,
  shirt:       `<path d="M9 4 4 7l2 3 2-1v11h8V9l2 1 2-3-5-3-2 2-2-1z"/>`,
  repeat:      `<path d="M17 4l3 3-3 3"/><path d="M20 7H8a4 4 0 0 0-4 4"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h12a4 4 0 0 0 4-4"/>`,
  share:       `<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/>`,
};

const ICON_OPTIONS = ['leaf','droplet','book','walk','yoga','pen','sun','moon','coffee','music','dumbbell','flame','target','sparkle','phone','heart','bike','bed','headphones','star','eye','camera','pill','tree','wind','chart','palette','apple','stretch','bowl','cart','utensils','paw','box','shirt'];

function icon(name, size, color, strokeWidth) {
  size = size || 22;
  color = color || 'currentColor';
  strokeWidth = strokeWidth || 1.7;
  const raw = ICON_PATHS[name] || ICON_PATHS['leaf'];
  const paths = raw.replace(/\$c/g, color);
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" style="display:block;flex-shrink:0" fill="none" stroke="' + color + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

// ── Color palette ──────────────────────────────────────────────
const HABIT_COLORS = [
  { id: 'sage',  bg: '#e6ebe1', ink: '#445a3c', dot: 'oklch(0.62 0.10 145)' },
  { id: 'clay',  bg: '#ecdfd2', ink: '#7a4a2c', dot: 'oklch(0.62 0.10 50)'  },
  { id: 'sky',   bg: '#dde5eb', ink: '#3c5468', dot: 'oklch(0.62 0.08 240)' },
  { id: 'lilac', bg: '#e3dee8', ink: '#574a6b', dot: 'oklch(0.62 0.08 300)' },
  { id: 'amber', bg: '#ede2c8', ink: '#705626', dot: 'oklch(0.65 0.12 85)'  },
  { id: 'rose',  bg: '#ecdcdc', ink: '#7a3f3f', dot: 'oklch(0.62 0.10 20)'  },
  { id: 'moss',  bg: '#dee5d4', ink: '#4a5a36', dot: 'oklch(0.58 0.09 130)' },
  { id: 'slate', bg: '#dfdfdb', ink: '#444240', dot: 'oklch(0.55 0.02 80)'  },
];

const LEGACY_COLOR_MAP = {
  '#ef4444': 'rose', '#f97316': 'clay',  '#eab308': 'amber',
  '#22c55e': 'sage', '#06b6d4': 'sky',   '#6366f1': 'lilac',
  '#8b5cf6': 'lilac','#ec4899': 'rose',
};

function colorById(id) {
  return HABIT_COLORS.find(function(c) { return c.id === id; }) || HABIT_COLORS[0];
}

function normalizeHabitColor(color) {
  if (!color) return 'sage';
  if (HABIT_COLORS.find(function(c) { return c.id === color; })) return color;
  return LEGACY_COLOR_MAP[color] || 'sage';
}

// ── Date/locale constants ──────────────────────────────────────
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const WEEKDAYS = ['L','M','X','J','V','S','D'];
const WEEKDAYS_LONG = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function isoDay(d) { return (d.getDay() + 6) % 7; }

// ── Onboarding suggestions ─────────────────────────────────────
const SUGGESTIONS = [
  { name: 'Meditar',        icon: 'leaf',    color: 'sage',  type: 'duration', goal: 10,   unit: 'min' },
  { name: 'Beber agua',     icon: 'droplet', color: 'sky',   type: 'count',    goal: 8,    unit: 'vasos' },
  { name: 'Leer',           icon: 'book',    color: 'clay',  type: 'duration', goal: 30,   unit: 'min' },
  { name: 'Correr',         icon: 'walk',    color: 'amber', type: 'binary',   goal: 1,    unit: '' },
  { name: 'Estirar',        icon: 'yoga',    color: 'lilac', type: 'duration', goal: 5,    unit: 'min' },
  { name: 'Escribir',       icon: 'pen',     color: 'moss',  type: 'duration', goal: 15,   unit: 'min' },
  { name: 'Sin café tarde', icon: 'coffee',  color: 'clay',  type: 'binary',   goal: 1,    unit: '' },
  { name: 'Caminar',        icon: 'walk',    color: 'sage',  type: 'count',    goal: 8000, unit: 'pasos' },
];
