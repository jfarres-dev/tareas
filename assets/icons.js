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
  target:      `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="$c" stroke="none"/>`,
  hash:        `<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>`,
  settings:    `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z"/>`,
  sparkle:     `<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>`,
  arrow:       `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  coffee:      `<path d="M4 8h12v6a5 5 0 0 1-10 0V8zM16 9h2a2 2 0 0 1 0 4h-2M7 3v2M10 3v2M13 3v2M4 20h14"/>`,
  music:       `<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>`,
  walk:        `<circle cx="13" cy="5" r="2"/><path d="M9 21l3-7-2-3 5-3 3 4 3 1M9 14l-2-2-3 1"/>`,
  phone:       `<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>`,
};

const ICON_OPTIONS = ['leaf','droplet','book','walk','yoga','pen','sun','moon','coffee','music','dumbbell','flame','target','sparkle','phone'];

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
