// ============================================================
// Family tasks — tareas asignadas compartidas
// ============================================================

async function fetchFamilyTasks(familyId) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .select('*')
    .eq('family_id', familyId)
    .or('done.eq.false,due_date.gte.' + today())
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createTask({ familyId, title, assigneeId, dueDate, icon, createdBy }) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .insert([{
      family_id: familyId,
      title: title,
      assignee_id: assigneeId,
      due_date: dueDate || today(),
      icon: icon || 'check',
      created_by: createdBy,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function toggleTask(id, done) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .update({ done: done, done_at: done ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTask(id) {
  const { error } = await supabaseClient
    .from('family_tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Icono automático según palabras clave del título
const TASK_ICON_RULES = [
  { re: /perro|gato|mascota|pasear/i, icon: 'paw' },
  { re: /cocinar|cena|comida|mesa|plato/i, icon: 'utensils' },
  { re: /comprar|compra|super/i, icon: 'cart' },
  { re: /ropa|lavadora|colada|tender|planchar/i, icon: 'shirt' },
  { re: /basura|reciclar/i, icon: 'trash' },
  { re: /regar|planta|jard/i, icon: 'leaf' },
  { re: /recoger|ordenar|habitaci|caja/i, icon: 'box' },
  { re: /limpiar|fregar|ba[ñn]o/i, icon: 'spray' },
  { re: /leer|deberes|estudiar/i, icon: 'book' },
  { re: /llamar|tel[eé]fono/i, icon: 'phone' },
];

function pickTaskIcon(title) {
  for (var i = 0; i < TASK_ICON_RULES.length; i++) {
    if (TASK_ICON_RULES[i].re.test(title)) return TASK_ICON_RULES[i].icon;
  }
  return 'check';
}
