// ============================================================
// App — state, routing, Supabase CRUD, event handlers
// ============================================================

// ── Global state ──────────────────────────────────────────────

let currentUser = null;
let habits = [];
let allLogs = [];
let currentTab = 'today';

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
    if (rawHabits.length === 0) {
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
  } catch (e) {
    console.error('loadDashboard error', e);
    showToast('Error cargando datos');
  }
}

function renderCurrentTab() {
  if (currentTab === 'today') {
    renderToday(currentUser, habits, allLogs);
  } else {
    renderHabitsList(currentUser, habits, allLogs);
  }
}

// ── Auth ──────────────────────────────────────────────────────

function switchAuthMode(mode) {
  renderAuth(mode);
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

  try {
    let result;
    if (nameEl) {
      // Signup
      result = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
    } else {
      // Login
      result = await supabaseClient.auth.signInWithPassword({ email, password });
    }
    if (result.error) throw result.error;
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message || 'Error de autenticación';
      errEl.classList.remove('hidden');
    }
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
    showToast('Error al guardar');
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
    showToast('Error al eliminar');
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
    showToast('Error al registrar');
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
    showToast('Error al registrar');
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
    showToast('Error al guardar');
  }
}

function closeValueSheet() {
  var el = document.getElementById('sheet-value');
  if (el) el.innerHTML = '';
  valueHabitId = null;
}

// ── Profile sheet ─────────────────────────────────────────────

function openProfile() {
  renderProfile(currentUser, habits);
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

// ── Data refresh ──────────────────────────────────────────────

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
