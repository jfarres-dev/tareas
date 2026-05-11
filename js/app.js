// ============================================================
// App: main logic, event wiring, router
// ============================================================

let currentUser = null;
let habits = [];
let allLogs = [];
let detailHabit = null;
let detailRange = 'week';
let editingHabitId = null;

// ---- Init ----
async function init() {
  const session = await getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadDashboard();
  } else {
    showView('view-auth');
  }

  onAuthStateChange(async (session) => {
    if (session?.user) {
      currentUser = session.user;
      await loadDashboard();
    } else {
      currentUser = null;
      habits = [];
      allLogs = [];
      showView('view-auth');
    }
  });

  wireAuthForms();
  wireDashboard();
  wireModal();
  wireDetailView();
  wireCountModal();
}

// ---- Dashboard ----
async function loadDashboard() {
  showView('view-dashboard');
  try {
    habits = await fetchHabits(currentUser.id);
    const fromDate = buildDateRange(90)[0];
    allLogs = await fetchAllLogsForUser(currentUser.id, fromDate);
    renderAllHabits();
  } catch (e) {
    showToast('Error cargando hábitos');
    console.error(e);
  }
}

function renderAllHabits() {
  renderHabits(
    habits,
    allLogs,
    handleCheck,
    handleDotClick,
    openDetail
  );
}

// ---- Check (binary) ----
async function handleCheck(habit, dateStr) {
  if (habit.type === 'count') {
    const existing = allLogs.find(l => l.habit_id === habit.id && l.log_date === dateStr);
    openCountModal(habit, existing?.value || 0, async (value) => {
      try {
        const log = await setLogValue(habit.id, currentUser.id, dateStr, value, habit.goal);
        updateLocalLog(log);
        renderAllHabits();
        showToast(value >= habit.goal ? '¡Meta alcanzada! 🎉' : `${value} / ${habit.goal} registrado`);
      } catch (e) { showToast('Error al guardar'); console.error(e); }
    });
    return;
  }

  try {
    const log = await toggleLog(habit.id, currentUser.id, dateStr);
    updateLocalLog(log);
    renderAllHabits();
    showToast(log.completed ? '¡Hábito completado! 🎉' : 'Desmarcado');
  } catch (e) { showToast('Error al guardar'); console.error(e); }
}

// ---- Dot click (in grid) ----
async function handleDotClick(habit, dateStr) {
  if (habit.type === 'count') {
    const existing = allLogs.find(l => l.habit_id === habit.id && l.log_date === dateStr);
    openCountModal(habit, existing?.value || 0, async (value) => {
      try {
        const log = await setLogValue(habit.id, currentUser.id, dateStr, value, habit.goal);
        updateLocalLog(log);
        renderAllHabits();
        if (detailHabit?.id === habit.id) refreshDetail();
      } catch (e) { showToast('Error al guardar'); console.error(e); }
    });
    return;
  }

  try {
    const log = await toggleLog(habit.id, currentUser.id, dateStr);
    updateLocalLog(log);
    renderAllHabits();
    if (detailHabit?.id === habit.id) refreshDetail();
  } catch (e) { showToast('Error al guardar'); console.error(e); }
}

function updateLocalLog(log) {
  const idx = allLogs.findIndex(l => l.id === log.id);
  if (idx >= 0) allLogs[idx] = log;
  else allLogs.push(log);
}

// ---- Detail view ----
async function openDetail(habit) {
  detailHabit = habit;
  detailRange = 'week';
  showView('view-detail');
  await refreshDetail();
  document.querySelector('.detail-tab[data-range="week"]').classList.add('active');
  document.querySelector('.detail-tab[data-range="month"]').classList.remove('active');
}

async function refreshDetail() {
  if (!detailHabit) return;
  const days = detailRange === 'week' ? 7 : 35;
  const fromDate = buildDateRange(days)[0];
  try {
    const logs = await fetchLogsForHabit(detailHabit.id, fromDate, today());
    renderDetail(detailHabit, logs, detailRange);
  } catch (e) { console.error(e); }
}

// ---- Auth forms ----
function wireAuthForms() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`form-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Login
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    try {
      await login(email, password);
    } catch (err) {
      errEl.textContent = translateAuthError(err.message);
    }
  });

  // Register
  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errEl = document.getElementById('register-error');
    const okEl = document.getElementById('register-success');
    errEl.textContent = '';
    okEl.textContent = '';
    try {
      await register(email, password);
      okEl.textContent = 'Cuenta creada. Revisa tu email para confirmar.';
    } catch (err) {
      errEl.textContent = translateAuthError(err.message);
    }
  });
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.';
  if (msg.includes('already registered')) return 'Este email ya está registrado.';
  if (msg.includes('Password should')) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}

// ---- Dashboard wiring ----
function wireDashboard() {
  document.getElementById('btn-view-grid').addEventListener('click', () => {
    setViewMode('grid');
    renderAllHabits();
  });
  document.getElementById('btn-view-list').addEventListener('click', () => {
    setViewMode('list');
    renderAllHabits();
  });
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await logout();
  });
  document.getElementById('btn-add-habit').addEventListener('click', () => {
    editingHabitId = null;
    openHabitModal(null);
  });
}

// ---- Modal wiring ----
function wireModal() {
  document.getElementById('modal-close').addEventListener('click', closeHabitModal);
  document.getElementById('btn-cancel-habit').addEventListener('click', closeHabitModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeHabitModal();
  });

  // Type toggle
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => setTypeBtn(btn.dataset.type));
  });

  // Form submit
  document.getElementById('form-habit').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('habit-name').value.trim();
    if (!name) return;

    const habitData = {
      name,
      icon: getSelectedIcon(),
      color: normalizeColor(getSelectedColor()),
      type: getSelectedType(),
      goal: getSelectedType() === 'count' ? parseInt(document.getElementById('habit-goal').value) || null : null,
    };

    try {
      if (editingHabitId) {
        const updated = await updateHabit(editingHabitId, habitData);
        const idx = habits.findIndex(h => h.id === editingHabitId);
        if (idx >= 0) habits[idx] = updated;
      } else {
        const created = await createHabit({ userId: currentUser.id, ...habitData });
        habits.push(created);
      }
      closeHabitModal();
      renderAllHabits();
      showToast(editingHabitId ? 'Hábito actualizado' : 'Hábito creado 🎉');
    } catch (err) {
      showToast('Error al guardar');
      console.error(err);
    }
  });
}

// ---- Detail view wiring ----
function wireDetailView() {
  document.getElementById('btn-back').addEventListener('click', () => {
    showView('view-dashboard');
    renderAllHabits();
  });

  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      detailRange = tab.dataset.range;
      refreshDetail();
    });
  });

  document.getElementById('btn-edit-habit').addEventListener('click', () => {
    if (!detailHabit) return;
    editingHabitId = detailHabit.id;
    openHabitModal(detailHabit);
  });

  document.getElementById('btn-delete-habit').addEventListener('click', async () => {
    if (!detailHabit) return;
    if (!confirm(`¿Eliminar "${detailHabit.name}"?`)) return;
    try {
      await deleteHabit(detailHabit.id);
      habits = habits.filter(h => h.id !== detailHabit.id);
      detailHabit = null;
      showView('view-dashboard');
      renderAllHabits();
      showToast('Hábito eliminado');
    } catch (e) { showToast('Error al eliminar'); console.error(e); }
  });
}

// ---- Count modal wiring ----
function wireCountModal() {
  document.getElementById('count-modal-close').addEventListener('click', closeCountModal);
  document.getElementById('count-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCountModal();
  });
  document.getElementById('count-minus').addEventListener('click', () => {
    const inp = document.getElementById('count-value');
    inp.value = Math.max(0, (parseInt(inp.value) || 0) - 1);
  });
  document.getElementById('count-plus').addEventListener('click', () => {
    const inp = document.getElementById('count-value');
    inp.value = (parseInt(inp.value) || 0) + 1;
  });
}

// ---- Util: normalize rgb() color to hex ----
function normalizeColor(color) {
  if (color.startsWith('#')) return color;
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return color;
  return '#' + [m[1],m[2],m[3]].map(n => (+n).toString(16).padStart(2,'0')).join('');
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', init);
