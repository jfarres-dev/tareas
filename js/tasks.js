// ============================================================
// Family tasks — tareas asignadas compartidas
// ============================================================

// Solo instancias/tareas sueltas (las plantillas recurrentes tienen frequency != null)
async function fetchFamilyTasks(familyId) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .select('*')
    .eq('family_id', familyId)
    .is('frequency', null)
    .or('done.eq.false,due_date.gte.' + today())
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function fetchTaskTemplates(familyId) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .select('*')
    .eq('family_id', familyId)
    .not('frequency', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createTask({ familyId, title, assigneeId, dueDate, icon, createdBy, frequency }) {
  const { data, error } = await supabaseClient
    .from('family_tasks')
    .insert([{
      family_id: familyId,
      title: title,
      assignee_id: assigneeId,
      due_date: dueDate || today(),
      icon: icon || 'check',
      created_by: createdBy,
      frequency: frequency || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ¿Toca esta frecuencia en la fecha dada? (daily | weekdays con days L=0..D=6)
function isTaskScheduledOn(frequency, date) {
  if (!frequency || !frequency.kind) return false;
  if (frequency.kind === 'daily') return true;
  if (frequency.kind === 'weekdays') {
    var days = frequency.days || [];
    return days.indexOf(isoDay(date)) !== -1;
  }
  return false;
}

// Crea las instancias de hoy que falten para cada plantilla programada.
// Devuelve true si insertó alguna (el índice único absorbe carreras entre clientes).
async function ensureTaskInstances(templates, tasks) {
  var todayStr = today();
  var created = false;
  for (var i = 0; i < templates.length; i++) {
    var tpl = templates[i];
    if (!isTaskScheduledOn(tpl.frequency, new Date())) continue;
    var exists = tasks.some(function(t) { return t.template_id === tpl.id && t.due_date === todayStr; });
    if (exists) continue;
    const { error } = await supabaseClient
      .from('family_tasks')
      .insert([{
        family_id: tpl.family_id,
        title: tpl.title,
        icon: tpl.icon,
        assignee_id: tpl.assignee_id,
        due_date: todayStr,
        template_id: tpl.id,
        created_by: tpl.created_by,
      }]);
    if (error) {
      if (error.code === '23505') continue; // otro cliente la creó a la vez
      throw error;
    }
    created = true;
  }
  return created;
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
