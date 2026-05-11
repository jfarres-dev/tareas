// ============================================================
// Habit logs: fetch, toggle, update value, stats
// ============================================================

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function today() {
  return toDateString(new Date());
}

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
  const completed = value >= goal;
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

function calcStreak(logs) {
  const completedDates = new Set(
    logs.filter(l => l.completed).map(l => l.log_date)
  );

  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = toDateString(d);
    if (completedDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calcStats(logs, createdAt) {
  const completed = logs.filter(l => l.completed);
  const streak = calcStreak(logs);

  const start = new Date(createdAt);
  const now = new Date();
  const daysSinceStart = Math.floor((now - start) / 86400000) + 1;

  const missedDays = Math.max(0, daysSinceStart - completed.length);

  return {
    streak,
    daysSinceStart,
    completions: completed.length,
    missedDays,
  };
}

function buildDateRange(days) {
  const dates = [];
  const d = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(d);
    date.setDate(d.getDate() - i);
    dates.push(toDateString(date));
  }
  return dates;
}
