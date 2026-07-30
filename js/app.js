// ============================================================
// App — state, routing, Supabase CRUD, event handlers
// ============================================================

// ── Global state ──────────────────────────────────────────────

let currentUser = null;
let habits = [];
let allLogs = [];
let currentTab = 'home';

// Familia
let myProfile = null;
let family = null;            // { id, name, role } | null
let familyMembers = [];       // [{ id, name, color, role }]
let familyTasks = [];
let familyTaskTemplates = []; // tareas recurrentes (frequency != null)
let shoppingItems = [];
let profileDraft = {};
let taskFilter = 'all';       // 'all' | member id
let habitsSubTab = 'today';   // 'today' | 'all'
let taskDraft = {};
let itemDraft = {};
let inviteInfo = null;        // { code, expires_at }
let pendingInviteCode = null;

// Theme
let currentTheme = localStorage.getItem('habitos-theme') || 'light';

// PWA install
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// Onboarding
let onboardStep = 0;
let onboardPicked = [];

// Detail
let detailHabitId = null;

// Create/Edit
let editingHabitId = null;
let draft = {};

// Value sheet
let valueHabitId = null;
let valueSheetVal = 0;

// ── Bootstrap ─────────────────────────────────────────────────

async function init() {
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Enlace de invitación: /tareas/?invite=FAM-XXXXXX
  try {
    var inviteParam = new URLSearchParams(location.search).get('invite');
    if (inviteParam) {
      pendingInviteCode = inviteParam.toUpperCase();
      history.replaceState(null, '', location.pathname);
    }
  } catch (e) { /* URLSearchParams no disponible */ }

  // Refrescar datos compartidos al volver a la app
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && currentUser && family) {
      refreshFamilyData(true);
    }
  });

  // Avisar al perder/recuperar la red y recargar datos al volver
  window.addEventListener('offline', function() {
    showToast('Sin conexión. Los cambios no se guardarán.');
  });
  window.addEventListener('online', function() {
    showToast('Conexión recuperada');
    if (currentUser) {
      reloadHabits();
      if (family) refreshFamilyData(true);
    }
  });

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser = session.user;
      await loadDashboard();
    } else {
      showView('view-auth');
      renderAuth('login');
    }
  } catch (e) {
    console.warn('init error (offline?)', e);
    showView('view-auth');
    renderAuth('login');
  }

  try {
    supabaseClient.auth.onAuthStateChange(async function(event, session) {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        await loadDashboard();
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        habits = [];
        allLogs = [];
        myProfile = null;
        family = null;
        familyMembers = [];
        familyTasks = [];
        shoppingItems = [];
        currentTab = 'home';
        showView('view-auth');
        renderAuth('login');
      }
    });
  } catch (e) {
    console.warn('onAuthStateChange setup error', e);
  }
}

async function loadDashboard() {
  try {
    const rawHabits = await fetchHabits(currentUser.id);

    // Perfil + familia (las tablas pueden no existir aún si no se ejecutó family.sql)
    try {
      myProfile = await ensureProfile(currentUser);
      family = await fetchMyFamily(currentUser.id);
      if (family) {
        await fetchFamilySharedData();
      } else {
        familyMembers = [];
        familyTasks = [];
        familyTaskTemplates = [];
        shoppingItems = [];
      }
    } catch (famErr) {
      console.warn('family load error (¿family.sql ejecutado?)', famErr);
      myProfile = null;
      family = null;
    }

    if (rawHabits.length === 0 && !family && !localStorage.getItem('habitos-onboarded')) {
      // New user → onboarding
      onboardStep = 0;
      onboardPicked = [];
      showView('view-onboarding');
      renderOnboarding(0, []);
      return;
    }
    const fromDate = toDateString(daysAgo(90));
    allLogs = await fetchAllLogsForUser(currentUser.id, fromDate);
    habits = rawHabits.map(function(h) { return enrichHabit(h, allLogs); });
    showView('view-app');
    renderTabBar(currentTab);
    renderCurrentTab();

    // Invitación pendiente desde el enlace
    if (pendingInviteCode && !family) {
      openJoinFamilySheet(pendingInviteCode);
      pendingInviteCode = null;
    }
  } catch (e) {
    console.error('loadDashboard error', e);
    showToast(errMsg('Error cargando datos'));
  }
}

function renderCurrentTab() {
  if (currentTab === 'home') {
    renderHome(myProfile, family, familyMembers, familyTasks, shoppingItems, habits);
  } else if (currentTab === 'tasks') {
    renderTasks(family, familyMembers, familyTasks, taskFilter);
  } else if (currentTab === 'shopping') {
    renderShopping(family, familyMembers, shoppingItems);
  } else {
    renderHabitsTab(currentUser, habits, allLogs, habitsSubTab);
  }
}

// ── Auth ──────────────────────────────────────────────────────

function switchAuthMode(mode) {
  renderAuth(mode);
}

// Mensaje de error genérico: si no hay red, decirlo claramente
function errMsg(fallback) {
  return navigator.onLine ? fallback : 'Sin conexión. Inténtalo cuando vuelvas a tener red.';
}

// Errores de Supabase Auth (en inglés) → mensajes en español
function authErrorMessage(e) {
  var msg = (e && e.message) || '';
  if (!navigator.onLine || /Failed to fetch|NetworkError|abort|Load failed/i.test(msg)) {
    return 'Sin conexión. Comprueba tu red e inténtalo de nuevo.';
  }
  if (msg.indexOf('Invalid login credentials') !== -1) return 'Correo o contraseña incorrectos.';
  if (msg.indexOf('Email not confirmed') !== -1) return 'Tu correo aún no está confirmado. Abre el enlace que te enviamos (mira también el spam).';
  if (msg.indexOf('User already registered') !== -1 || msg === 'USER_EXISTS') return 'Este correo ya está registrado. Entra con tu contraseña.';
  if (msg.indexOf('Password should be at least') !== -1) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espera un minuto y vuelve a probarlo.';
  return msg || 'Error de autenticación. Inténtalo de nuevo.';
}

function setAuthLoading(loading, label) {
  var btn = document.getElementById('auth-submit-btn');
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span>' + label;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || btn.textContent;
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const emailEl = document.getElementById('auth-email');
  const passwordEl = document.getElementById('auth-password');
  const nameEl = document.getElementById('auth-name');
  const errEl = document.getElementById('auth-error');
  const email = emailEl ? emailEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';
  const name = nameEl ? nameEl.value.trim() : '';
  if (errEl) errEl.classList.add('hidden');

  const isSignup = !!nameEl;
  if (!navigator.onLine) {
    if (errEl) {
      errEl.textContent = 'Sin conexión. Comprueba tu red e inténtalo de nuevo.';
      errEl.classList.remove('hidden');
    }
    return;
  }
  setAuthLoading(true, isSignup ? 'Creando cuenta…' : 'Entrando…');

  try {
    let result;
    if (isSignup) {
      result = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (result.error) throw result.error;
      var newUser = result.data && result.data.user;
      // Supabase devuelve un usuario "fantasma" sin identidades cuando el
      // correo ya existe (para no revelar qué correos están registrados)
      if (newUser && newUser.identities && newUser.identities.length === 0) {
        throw { message: 'USER_EXISTS' };
      }
      if (!result.data.session) {
        // Confirmación por correo activada: aún no hay sesión
        renderAuthEmailSent(email);
        return;
      }
      // Sin confirmación: el evento SIGNED_IN carga el dashboard
    } else {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      setAuthLoading(true, 'Cargando tus datos…');
      // El evento SIGNED_IN carga el dashboard; el botón queda en carga
      // hasta que cambia la vista
    }
  } catch (e) {
    if (errEl) {
      errEl.textContent = authErrorMessage(e);
      errEl.classList.remove('hidden');
    }
    setAuthLoading(false);
  }
}

// ── Onboarding ────────────────────────────────────────────────

function onboardNext(step) {
  onboardStep = step;
  renderOnboarding(step, onboardPicked);
}

function toggleSuggestion(index) {
  var pos = onboardPicked.indexOf(index);
  if (pos === -1) {
    onboardPicked.push(index);
  } else {
    onboardPicked.splice(pos, 1);
  }
  renderOnboarding(onboardStep, onboardPicked);
}

function skipOnboarding() {
  onboardPicked = [];
  finishOnboarding();
}

async function finishOnboarding() {
  localStorage.setItem('habitos-onboarded', '1');
  try {
    for (var i = 0; i < onboardPicked.length; i++) {
      var s = SUGGESTIONS[onboardPicked[i]];
      await createHabit({
        userId: currentUser.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        type: s.type,
        goal: s.goal,
        unit: s.unit,
        frequency: { kind: 'daily' },
      });
    }
    await loadDashboard();
  } catch (e) {
    console.error('finishOnboarding error', e);
    await loadDashboard();
  }
}

// ── Tab navigation ────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  renderTabBar(tab);
  renderCurrentTab();
  // Render inmediato con caché + refetch silencioso de datos compartidos
  if (family && (tab === 'home' || tab === 'tasks' || tab === 'shopping')) {
    refreshFamilyData(true);
  }
  if (tab === 'habits') {
    reloadHabits();
  }
}

// ── Detail overlay ────────────────────────────────────────────

function openDetail(habitId) {
  detailHabitId = habitId;
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  renderDetail(habit, allLogs);
  showOverlay('overlay-detail');
}

function closeDetail() {
  hideOverlay('overlay-detail');
  detailHabitId = null;
}

// ── Create / Edit overlay ─────────────────────────────────────

function openCreate() {
  editingHabitId = null;
  draft = { type: 'binary', color: 'sage', icon: 'leaf', frequency: { kind: 'daily' } };
  renderCreate(draft, false);
  showOverlay('overlay-create');
}

function openEdit(habitId) {
  editingHabitId = habitId;
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  draft = {
    name: habit.name,
    type: habit.type,
    color: habit.color,
    icon: habit.icon || 'leaf',
    goal: habit.goal,
    unit: habit.unit,
    frequency: habit.frequency || { kind: 'daily' },
  };
  renderCreate(draft, true);
  showOverlay('overlay-create');
}

function closeCreate() {
  hideOverlay('overlay-create');
}

// Draft field updaters (called from form oninput/onclick)
function updateDraftName(val) { draft.name = val; }
function updateDraftTarget(val) { draft.goal = val ? Number(val) : null; }
function updateDraftUnit(val) { draft.unit = val; }

function setDraftType(val) {
  draft.type = val;
  renderCreate(draft, !!editingHabitId);
}

function setDraftColor(val) {
  draft.color = val;
  renderCreate(draft, !!editingHabitId);
}

function setDraftIcon(val) {
  draft.icon = val;
  renderCreate(draft, !!editingHabitId);
}

function setDraftFreqKind(kind) {
  draft.frequency = { kind: kind };
  if (kind === 'weekdays') draft.frequency.days = [0,1,2,3,4];
  if (kind === 'per-week' || kind === 'per-month') draft.frequency.n = 3;
  renderCreate(draft, !!editingHabitId);
}

function toggleFreqDay(dayIndex) {
  if (!draft.frequency) draft.frequency = { kind: 'weekdays', days: [] };
  var days = draft.frequency.days || [];
  var pos = days.indexOf(dayIndex);
  if (pos === -1) days.push(dayIndex);
  else days.splice(pos, 1);
  days.sort(function(a, b) { return a - b; });
  draft.frequency.days = days;
  renderCreate(draft, !!editingHabitId);
}

function setDraftFreqN(n) {
  if (!draft.frequency) return;
  draft.frequency.n = n;
  renderCreate(draft, !!editingHabitId);
}

async function saveHabit() {
  if (!draft.name || !draft.name.trim()) {
    showToast('El nombre es obligatorio');
    return;
  }
  try {
    if (editingHabitId) {
      await updateHabit(editingHabitId, {
        name: draft.name.trim(),
        icon: draft.icon || 'leaf',
        color: draft.color || 'sage',
        type: draft.type || 'binary',
        goal: draft.goal || null,
        unit: draft.unit || null,
        frequency: draft.frequency || { kind: 'daily' },
      });
      showToast('Hábito actualizado');
    } else {
      await createHabit({
        userId: currentUser.id,
        name: draft.name.trim(),
        icon: draft.icon || 'leaf',
        color: draft.color || 'sage',
        type: draft.type || 'binary',
        goal: draft.goal || null,
        unit: draft.unit || null,
        frequency: draft.frequency || { kind: 'daily' },
      });
      showToast('Hábito creado');
    }
    closeCreate();
    if (detailHabitId) closeDetail();
    await reloadHabits();
  } catch (e) {
    console.error('saveHabit error', e);
    showToast(errMsg('Error al guardar'));
  }
}

async function deleteCurrentHabit() {
  if (!editingHabitId) return;
  if (!confirm('¿Eliminar este hábito? No se puede deshacer.')) return;
  try {
    await deleteHabit(editingHabitId);
    closeCreate();
    closeDetail();
    showToast('Hábito eliminado');
    await reloadHabits();
  } catch (e) {
    console.error('deleteHabit error', e);
    showToast(errMsg('Error al eliminar'));
  }
}

// ── Habit interaction ─────────────────────────────────────────

async function handleCheck(habitId) {
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;

  if (habit.type !== 'binary') {
    // Open value sheet for count/duration
    openValueSheet(habitId);
    return;
  }

  try {
    var todayStr = today();
    var updated = await toggleLog(habit.id, currentUser.id, todayStr);
    await reloadHabits();
    // Re-render detail if open
    if (detailHabitId === habitId) {
      var refreshed = habits.find(function(h) { return h.id === habitId; });
      if (refreshed) renderDetail(refreshed, allLogs);
    }
  } catch (e) {
    console.error('handleCheck error', e);
    showToast(errMsg('Error al registrar'));
  }
}

async function handleQuickIncrement(habitId) {
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  var todayStr = today();
  var current = typeof habit.log[todayStr] === 'number' ? habit.log[todayStr] : 0;
  var step = getHabitStep(habit);
  var newVal = current + step;
  try {
    await setLogValue(habit.id, currentUser.id, todayStr, newVal, habit.target || habit.goal);
    await reloadHabits();
  } catch (e) {
    console.error('handleQuickIncrement error', e);
    showToast(errMsg('Error al registrar'));
  }
}

async function handleDetailDecrement(habitId) {
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  var todayStr = today();
  var current = typeof habit.log[todayStr] === 'number' ? habit.log[todayStr] : 0;
  var step = getHabitStep(habit);
  var newVal = Math.max(0, current - step);
  try {
    await setLogValue(habit.id, currentUser.id, todayStr, newVal, habit.target || habit.goal);
    await reloadHabits();
    var refreshed = habits.find(function(h) { return h.id === habitId; });
    if (refreshed) renderDetail(refreshed, allLogs);
  } catch (e) {
    console.error('handleDetailDecrement error', e);
  }
}

async function handleDetailIncrement(habitId) {
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  var todayStr = today();
  var current = typeof habit.log[todayStr] === 'number' ? habit.log[todayStr] : 0;
  var step = getHabitStep(habit);
  var newVal = current + step;
  try {
    await setLogValue(habit.id, currentUser.id, todayStr, newVal, habit.target || habit.goal);
    await reloadHabits();
    var refreshed = habits.find(function(h) { return h.id === habitId; });
    if (refreshed) renderDetail(refreshed, allLogs);
  } catch (e) {
    console.error('handleDetailIncrement error', e);
  }
}

// ── Value sheet ───────────────────────────────────────────────

function openValueSheet(habitId) {
  valueHabitId = habitId;
  var habit = habits.find(function(h) { return h.id === habitId; });
  if (!habit) return;
  var todayStr = today();
  valueSheetVal = typeof habit.log[todayStr] === 'number' ? habit.log[todayStr] : 0;
  renderValueSheet(habit, valueSheetVal);
}

function adjustValue(delta) {
  var habit = habits.find(function(h) { return h.id === valueHabitId; });
  var step = habit ? getHabitStep(habit) : 1;
  valueSheetVal = Math.max(0, valueSheetVal + delta * step);
  var numEl = document.getElementById('value-num');
  if (numEl) numEl.textContent = valueSheetVal;
}

async function confirmValue() {
  var habit = habits.find(function(h) { return h.id === valueHabitId; });
  if (!habit) return;
  try {
    var todayStr = today();
    await setLogValue(habit.id, currentUser.id, todayStr, valueSheetVal, habit.target || habit.goal);
    closeValueSheet();
    await reloadHabits();
    if (detailHabitId === valueHabitId) {
      var refreshed = habits.find(function(h) { return h.id === valueHabitId; });
      if (refreshed) renderDetail(refreshed, allLogs);
    }
    showToast('Registrado');
  } catch (e) {
    console.error('confirmValue error', e);
    showToast(errMsg('Error al guardar'));
  }
}

function closeValueSheet() {
  var el = document.getElementById('sheet-value');
  if (el) el.innerHTML = '';
  valueHabitId = null;
}

// ── Profile sheet ─────────────────────────────────────────────

function openProfile() {
  renderProfile(currentUser, habits, family, myProfile);
}

function closeProfile() {
  var el = document.getElementById('sheet-profile');
  if (el) el.innerHTML = '';
}

async function handleLogout() {
  closeProfile();
  await supabaseClient.auth.signOut();
}

function handleThemeToggle() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('habitos-theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
  openProfile();
}

function isStandalone() {
  return window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
}

async function handleInstallPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  var result = await deferredInstallPrompt.userChoice;
  if (result.outcome === 'accepted') deferredInstallPrompt = null;
  openProfile();
}

function showIOSInstallHint() {
  showToast('Pulsa el botón Compartir ↑ y luego "Añadir a pantalla de inicio"');
}

// ── Quick add (FAB) ───────────────────────────────────────────

function openQuickAdd() {
  renderQuickAddSheet();
}

function closeQuickAdd() {
  var el = document.getElementById('sheet-quick');
  if (el) el.innerHTML = '';
}

function quickAddPick(kind) {
  closeQuickAdd();
  if (kind === 'habit') {
    openCreate();
  } else if (kind === 'task') {
    openAddTaskSheet();
  } else if (kind === 'item') {
    openAddItemSheet();
  }
}

function closeAddSheet() {
  var el = document.getElementById('sheet-add');
  if (el) el.innerHTML = '';
}

function requireFamily() {
  if (family) return true;
  closeAddSheet();
  openCreateFamilySheet();
  return false;
}

// ── Family tasks ──────────────────────────────────────────────

function openAddTaskSheet() {
  if (!requireFamily()) return;
  taskDraft = { title: '', assigneeId: currentUser.id, dueDate: today(), repeat: 'once', days: [0,1,2,3,4,5,6] };
  renderAddTaskSheet(taskDraft, familyMembers);
}

function updateTaskTitle(val) {
  taskDraft.title = val;
  var btn = document.getElementById('save-task-btn');
  if (btn) btn.style.opacity = val.trim() ? '1' : '0.4';
}

function setTaskAssignee(id) {
  taskDraft.assigneeId = id;
  renderAddTaskSheet(taskDraft, familyMembers);
}

function setTaskDue(offset) {
  taskDraft.repeat = 'once';
  taskDraft.dueDate = offset === 1 ? tomorrow() : today();
  renderAddTaskSheet(taskDraft, familyMembers);
}

function setTaskRepeat() {
  taskDraft.repeat = 'recurring';
  renderAddTaskSheet(taskDraft, familyMembers);
}

function toggleTaskDay(dayIndex) {
  var days = taskDraft.days || [];
  var pos = days.indexOf(dayIndex);
  if (pos === -1) days.push(dayIndex);
  else if (days.length > 1) days.splice(pos, 1); // al menos un día
  days.sort(function(a, b) { return a - b; });
  taskDraft.days = days;
  renderAddTaskSheet(taskDraft, familyMembers);
}

async function saveTask() {
  if (!taskDraft.title || !taskDraft.title.trim()) return;
  var frequency = null;
  if (taskDraft.repeat === 'recurring') {
    frequency = taskDraft.days.length === 7
      ? { kind: 'daily' }
      : { kind: 'weekdays', days: taskDraft.days.slice() };
  }
  try {
    await createTask({
      familyId: family.id,
      title: taskDraft.title.trim(),
      assigneeId: taskDraft.assigneeId,
      dueDate: taskDraft.dueDate,
      icon: pickTaskIcon(taskDraft.title),
      createdBy: currentUser.id,
      frequency: frequency,
    });
    closeAddSheet();
    showToast(frequency ? 'Tarea recurrente creada' : 'Tarea creada');
    await refreshFamilyData();
  } catch (e) {
    console.error('saveTask error', e);
    showToast(errMsg('Error al guardar'));
  }
}

async function handleToggleTask(id) {
  var task = familyTasks.find(function(t) { return t.id === id; });
  if (!task) return;
  task.done = !task.done; // optimista
  renderCurrentTab();
  try {
    await toggleTask(id, task.done);
  } catch (e) {
    console.error('handleToggleTask error', e);
    task.done = !task.done;
    renderCurrentTab();
    showToast(errMsg('Error al registrar'));
  }
}

async function handleDeleteTask(id) {
  var task = familyTasks.find(function(t) { return t.id === id; });
  if (!task) return;
  try {
    if (task.template_id) {
      // Instancia de una tarea recurrente
      if (confirm('Esta tarea se repite. ¿Eliminar también las próximas repeticiones?\n\nAceptar: eliminar la tarea recurrente entera.\nCancelar: quitar solo la de hoy.')) {
        await deleteTask(task.template_id); // el cascade borra las instancias
        showToast('Tarea recurrente eliminada');
      } else {
        await deleteTask(id);
        showToast('Tarea eliminada');
      }
    } else {
      if (!confirm('¿Eliminar esta tarea?')) return;
      await deleteTask(id);
      showToast('Tarea eliminada');
    }
    await refreshFamilyData();
  } catch (e) {
    console.error('handleDeleteTask error', e);
    showToast(errMsg('Error al eliminar'));
  }
}

function setTaskFilter(val) {
  taskFilter = val;
  renderCurrentTab();
}

// ── Shopping list ─────────────────────────────────────────────

function openAddItemSheet() {
  if (!requireFamily()) return;
  itemDraft = { name: '', qty: '', category: 'otros' };
  renderAddItemSheet(itemDraft);
}

function updateItemName(val) {
  itemDraft.name = val;
  var btn = document.getElementById('save-item-btn');
  if (btn) btn.style.opacity = val.trim() ? '1' : '0.4';
}

function updateItemQty(val) {
  itemDraft.qty = val;
}

function setItemCategory(id) {
  itemDraft.category = id;
  renderAddItemSheet(itemDraft);
}

async function saveItem() {
  if (!itemDraft.name || !itemDraft.name.trim()) return;
  try {
    await addShoppingItem({
      familyId: family.id,
      name: itemDraft.name.trim(),
      qty: (itemDraft.qty || '').trim() || null,
      category: itemDraft.category,
      addedBy: currentUser.id,
    });
    closeAddSheet();
    showToast('Añadido a la lista');
    await refreshFamilyData();
  } catch (e) {
    console.error('saveItem error', e);
    showToast(errMsg('Error al guardar'));
  }
}

async function handleToggleItem(id) {
  var item = shoppingItems.find(function(i) { return i.id === id; });
  if (!item) return;
  item.checked = !item.checked; // optimista
  renderCurrentTab();
  try {
    await toggleShoppingItem(id, item.checked);
  } catch (e) {
    console.error('handleToggleItem error', e);
    item.checked = !item.checked;
    renderCurrentTab();
    showToast(errMsg('Error al registrar'));
  }
}

async function handleClearChecked() {
  var count = shoppingItems.filter(function(i) { return i.checked; }).length;
  if (count === 0) return;
  try {
    await clearCheckedItems(family.id);
    showToast(count === 1 ? '1 artículo quitado' : count + ' artículos quitados');
    await refreshFamilyData();
  } catch (e) {
    console.error('handleClearChecked error', e);
    showToast(errMsg('Error al quitar'));
  }
}

// ── Family management ─────────────────────────────────────────

function openMembers() {
  if (!family) { openCreateFamilySheet(); return; }
  renderMembers(family, familyMembers, familyTasks, currentUser.id);
  showOverlay('overlay-members');
}

function closeMembers() {
  hideOverlay('overlay-members');
}

function openCreateFamilySheet() {
  var first = ((myProfile && myProfile.name) || '').split(' ')[0];
  renderCreateFamilySheet(first ? 'Familia de ' + first : 'Mi familia');
}

async function handleCreateFamily() {
  var input = document.getElementById('family-name-input');
  var name = input ? input.value.trim() : '';
  if (!name) { showToast('Pon un nombre a la familia'); return; }
  try {
    await createFamily(name);
    closeAddSheet();
    showToast('Familia creada');
    await loadDashboard();
  } catch (e) {
    console.error('handleCreateFamily error', e);
    showToast(familyErrorMessage(e));
  }
}

function openJoinFamilySheet(prefill) {
  renderJoinFamilySheet(prefill || '');
}

async function handleJoinFamily() {
  var input = document.getElementById('invite-code-input');
  var code = input ? input.value.trim().toUpperCase() : '';
  if (!code) { showToast('Introduce el código'); return; }
  try {
    await joinFamilyWithCode(code);
    closeAddSheet();
    await loadDashboard();
    showToast(family ? 'Te has unido a ' + family.name : 'Te has unido a la familia');
  } catch (e) {
    console.error('handleJoinFamily error', e);
    showToast(familyErrorMessage(e));
  }
}

async function openInviteSheet() {
  try {
    inviteInfo = await createFamilyInvite();
    renderInviteSheet(inviteInfo, inviteLink(inviteInfo.code));
  } catch (e) {
    console.error('openInviteSheet error', e);
    showToast(familyErrorMessage(e));
  }
}

// Invalida el código actual y muestra uno nuevo
async function handleRegenerateInvite() {
  try {
    await revokeFamilyInvite();
    inviteInfo = await createFamilyInvite();
    renderInviteSheet(inviteInfo, inviteLink(inviteInfo.code));
    showToast('Código nuevo generado');
  } catch (e) {
    console.error('handleRegenerateInvite error', e);
    showToast(familyErrorMessage(e));
  }
}

async function handleRevokeInvite() {
  try {
    await revokeFamilyInvite();
    inviteInfo = null;
    closeAddSheet();
    showToast('Código invalidado');
  } catch (e) {
    console.error('handleRevokeInvite error', e);
    showToast(familyErrorMessage(e));
  }
}

function inviteLink(code) {
  return location.origin + location.pathname + '?invite=' + encodeURIComponent(code);
}

async function copyToClipboard(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(msg || 'Copiado');
  } catch (e) {
    // Fallback para navegadores sin Clipboard API
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(msg || 'Copiado');
    } catch (e2) {
      showToast('No se pudo copiar');
    }
  }
}

function handleCopyInviteCode() {
  if (inviteInfo) copyToClipboard(inviteInfo.code);
}

function handleCopyInviteLink() {
  if (inviteInfo) copyToClipboard(inviteLink(inviteInfo.code));
}

async function handleLeaveFamily() {
  if (!confirm('¿Salir de la familia? Dejarás de ver las tareas y la compra compartidas.')) return;
  try {
    await leaveFamily(currentUser.id);
    closeMembers();
    showToast('Has salido de la familia');
    currentTab = 'home';
    await loadDashboard();
  } catch (e) {
    console.error('handleLeaveFamily error', e);
    showToast(errMsg('Error al salir'));
  }
}

// ── Edit profile ──────────────────────────────────────────────

function openEditProfileSheet() {
  if (!myProfile) { showToast('Perfil no disponible'); return; }
  closeProfile();
  profileDraft = {
    name: myProfile.name || '',
    color: memberColor(myProfile),
  };
  renderEditProfileSheet(profileDraft);
}

function updateProfileDraftName(val) {
  profileDraft.name = val;
}

function setProfileDraftColor(id) {
  profileDraft.color = id;
  renderEditProfileSheet(profileDraft);
}

async function handleSaveProfile() {
  var name = (profileDraft.name || '').trim();
  if (!name) { showToast('El nombre es obligatorio'); return; }
  try {
    myProfile = await updateProfile(currentUser.id, { name: name, color: profileDraft.color });
    var mine = familyMembers.find(function(m) { return m.id === currentUser.id; });
    if (mine) { mine.name = myProfile.name; mine.color = myProfile.color; }
    closeAddSheet();
    showToast('Perfil actualizado');
    renderCurrentTab();
  } catch (e) {
    console.error('handleSaveProfile error', e);
    showToast(errMsg('Error al guardar'));
  }
}

// ── Share app ─────────────────────────────────────────────────

async function handleShareApp() {
  var url = location.origin + location.pathname;
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Hábitos',
        text: 'Organizamos las tareas de casa, la lista de la compra y nuestros hábitos con esta app. ¡Pruébala!',
        url: url,
      });
    } catch (e) { /* el usuario canceló el diálogo */ }
  } else {
    copyToClipboard(url, 'Enlace copiado');
  }
}

// ── Habits sub-tab ────────────────────────────────────────────

function setHabitsSubTab(val) {
  habitsSubTab = val;
  renderCurrentTab();
}

// ── Data refresh ──────────────────────────────────────────────

// Descarga miembros, tareas, plantillas y compra; materializa las
// instancias de hoy de las tareas recurrentes que falten.
async function fetchFamilySharedData() {
  const results = await Promise.all([
    fetchFamilyMembers(family.id),
    fetchFamilyTasks(family.id),
    fetchTaskTemplates(family.id),
    fetchShoppingItems(family.id),
  ]);
  familyMembers = results[0];
  familyTasks = results[1];
  familyTaskTemplates = results[2];
  shoppingItems = results[3];
  const created = await ensureTaskInstances(familyTaskTemplates, familyTasks);
  if (created) familyTasks = await fetchFamilyTasks(family.id);
}

async function refreshFamilyData(silent) {
  if (!family) return;
  try {
    await fetchFamilySharedData();
    if (currentTab === 'home' || currentTab === 'tasks' || currentTab === 'shopping') {
      renderCurrentTab();
    }
  } catch (e) {
    console.error('refreshFamilyData error', e);
    if (!silent) showToast(errMsg('Error cargando datos'));
  }
}

async function reloadHabits() {
  try {
    const rawHabits = await fetchHabits(currentUser.id);
    const fromDate = toDateString(daysAgo(90));
    allLogs = await fetchAllLogsForUser(currentUser.id, fromDate);
    habits = rawHabits.map(function(h) { return enrichHabit(h, allLogs); });
    renderCurrentTab();
  } catch (e) {
    console.error('reloadHabits error', e);
  }
}

// ── Start ─────────────────────────────────────────────────────

init();
