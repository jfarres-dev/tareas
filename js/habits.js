// ============================================================
// Habits CRUD
// ============================================================

async function fetchHabits(userId) {
  const { data, error } = await supabaseClient
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createHabit({ userId, name, icon, color, type, goal, unit, frequency }) {
  const { data, error } = await supabaseClient
    .from('habits')
    .insert([{
      user_id: userId,
      name,
      icon: icon || 'leaf',
      color: color || 'sage',
      type: type || 'binary',
      goal: goal || null,
      unit: unit || null,
      frequency: frequency || { kind: 'daily' },
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateHabit(id, { name, icon, color, type, goal, unit, frequency }) {
  const { data, error } = await supabaseClient
    .from('habits')
    .update({
      name,
      icon: icon || 'leaf',
      color: color || 'sage',
      type: type || 'binary',
      goal: goal || null,
      unit: unit || null,
      frequency: frequency || { kind: 'daily' },
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteHabit(id) {
  const { error } = await supabaseClient
    .from('habits')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}
