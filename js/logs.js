// ============================================================
// Habit logs: fetch, toggle, update value, stats, date helpers
// ============================================================

const DAY_MS = 86400000;

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function today() {
  return toDateString(new Date());
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

// ── Supabase log ops ──────────────────────────────────────────

async function fetchLogsForHabit(habitId, fromDate, toDate) {
  const { data, error } = await supabaseClient
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate);
  if (error) throw error;
  return data;
}

async function fetchAllLogsForUser(userId, fromDate) {
  const { data, error } = await supabaseClient
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', fromDate);
  if (error) throw error;
  return data;
}

async function toggleLog(habitId, userId, logDate) {
  const { data: existing } = await supabaseClient
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (existing) {
    const newState = !existing.completed;
    const { data, error } = await supabaseClient
      .from('habit_logs')
      .update({ completed: newState })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabaseClient
      .from('habit_logs')
      .insert([{ habit_id: habitId, user_id: userId, log_date: logDate, completed: true, value: 0 }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

async function setLogValue(habitId, userId, logDate, value, goal) {
  const completed = goal ? value >= goal : value > 0;
  const { data: existing } = await supabaseClient
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabaseClient
      .from('habit_logs')
      .update({ value, completed })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabaseClient
      .from('habit_logs')
      .insert([{ habit_id: habitId, user_id: userId, log_date: logDate, value, completed }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ── Frequency helpers ─────────────────────────────────────────

function isScheduledOn(habit, date) {
  var f = habit.frequency;
  if (!f || f.kind === 'daily') return true;
  if (f.kind === 'weekdays') return f.days.indexOf(isoDay(date)) !== -1;
  // per-week / per-month: every day counts as a potential slot
  return true;
}

function freqLabel(f) {
  if (!f) return 'Cada día';
  if (f.kind === 'daily') return 'Cada día';
  if (f.kind === 'weekdays') {
    if (f.days.length === 7) return 'Cada día';
    if (f.days.length === 5 && f.days.every(function(d) { return d < 5; })) return 'Lun – Vie';
    if (f.days.length === 2 && f.days[0] === 5 && f.days[1] === 6) return 'Fines de semana';
    return f.days.map(function(d) { return WEEKDAYS[d]; }).join(' · ');
  }
  if (f.kind === 'per-week') return f.n + '× por semana';
  if (f.kind === 'per-month') return f.n + '× al mes';
  return '';
}

// ── Log map & completion ──────────────────────────────────────

function buildLogMap(habit, allLogs) {
  var map = {};
  for (var i = 0; i < allLogs.length; i++) {
    var log = allLogs[i];
    if (log.habit_id !== habit.id) continue;
    if (habit.type === 'binary') {
      if (log.completed) map[log.log_date] = true;
    } else {
      if (log.value > 0) map[log.log_date] = log.value;
    }
  }
  return map;
}

function isComplete(habit, val) {
  if (val == null) return false;
  if (habit.type === 'binary') return val === true || val === 1;
  if (habit.type === 'duration' || habit.type === 'count') {
    return typeof val === 'number' && val >= (habit.target || habit.goal || 1);
  }
  return false;
}

// Enrich habit with normalized color, target alias, and log map
function enrichHabit(habit, allLogs) {
  var color = normalizeHabitColor(habit.color);
  var frequency = habit.frequency || { kind: 'daily' };
  var target = habit.goal || 1;
  var enriched = Object.assign({}, habit, {
    color: color,
    frequency: frequency,
    target: target,
    log: buildLogMap(habit, allLogs),
  });
  return enriched;
}

// ── Stats ─────────────────────────────────────────────────────

function calcCurrentStreak(habit) {
  var s = 0;
  for (var i = 0; i < 400; i++) {
    var d = daysAgo(i);
    if (!isScheduledOn(habit, d)) continue;
    var v = habit.log[fmtKey(d)];
    if (isComplete(habit, v)) s++;
    else break;
  }
  return s;
}

function calcBestStreak(habit) {
  var best = 0, cur = 0;
  for (var i = 365; i >= 0; i--) {
    var d = daysAgo(i);
    if (!isScheduledOn(habit, d)) continue;
    var v = habit.log[fmtKey(d)];
    if (isComplete(habit, v)) { cur++; if (cur > best) best = cur; }
    else cur = 0;
  }
  return best;
}

function calcCompletionRate(habit, days) {
  days = days || 30;
  var scheduled = 0, done = 0;
  for (var i = 0; i < days; i++) {
    var d = daysAgo(i);
    if (!isScheduledOn(habit, d)) continue;
    scheduled++;
    if (isComplete(habit, habit.log[fmtKey(d)])) done++;
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}

// Legacy helpers (kept for compatibility)
function buildDateRange(days) {
  var dates = [];
  var d = new Date();
  for (var i = days - 1; i >= 0; i--) {
    var date = new Date(d);
    date.setDate(d.getDate() - i);
    dates.push(toDateString(date));
  }
  return dates;
}
