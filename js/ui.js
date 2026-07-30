// ============================================================
// UI — rendering functions (vanilla JS → innerHTML)
// ============================================================

// ── Shared components ─────────────────────────────────────────

function buildHabitIcon(habit, done, size) {
  size = size || 40;
  var c = colorById(habit.color);
  var bg = done ? c.dot : c.bg;
  var ink = done ? '#fff' : c.ink;
  var inner = icon(habit.icon || 'leaf', Math.round(size * 0.5), ink, 1.7);
  return '<div class="habit-icon" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background var(--pop)">' + inner + '</div>';
}

function buildCheckCircle(habit, value, size) {
  size = size || 32;
  var done = isComplete(habit, value);
  var c = colorById(habit.color);
  var r = (size / 2) - 2;
  var circ = 2 * Math.PI * r;
  var pct = 0;
  if (habit.type === 'binary') {
    pct = done ? 1 : 0;
  } else {
    var target = habit.target || habit.goal || 1;
    pct = typeof value === 'number' ? Math.min(value / target, 1) : 0;
  }
  var dash = pct * circ;
  var gap = circ - dash;
  var strokeBg = done ? c.dot : 'var(--line)';
  var strokeFg = c.dot;
  // Wrap in button so the full area is clickable (SVG pointer-events only fires on painted pixels)
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="display:block;overflow:visible">'
    + '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="' + (done ? c.dot : 'none') + '" stroke="' + strokeBg + '" stroke-width="2"/>'
    + '<rect x="0" y="0" width="' + size + '" height="' + size + '" fill="transparent"/>'
    + (pct > 0 && pct < 1
      ? '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="' + strokeFg + '" stroke-width="2" stroke-dasharray="' + dash.toFixed(1) + ' ' + gap.toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 ' + (size/2) + ' ' + (size/2) + ')"/>'
      : '')
    + (done
      ? '<path d="M' + (size*0.28) + ' ' + (size*0.5) + 'l' + (size*0.18) + ' ' + (size*0.18) + 'l' + (size*0.28) + '-' + (size*0.28) + '" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
      : '')
    + '</svg>';
}

function buildProgressDial(done, total) {
  var size = 64;
  var r = 26;
  var circ = 2 * Math.PI * r;
  var pct = total === 0 ? 0 : Math.min(done / total, 1);
  var dash = pct * circ;
  var gap = circ - dash;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" class="progress-dial">'
    + '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="3"/>'
    + '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="' + dash.toFixed(1) + ' ' + gap.toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 32 32)"/>'
    + '<text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-family="var(--sans)" font-size="14" font-weight="600" fill="var(--ink)">' + done + '/' + total + '</text>'
    + '</svg>';
}

function buildAvatar(user, size) {
  size = size || 36;
  var letter = (user && (user.email || user.user_metadata && user.user_metadata.name) || 'U')[0].toUpperCase();
  return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-weight:600;font-size:' + Math.round(size*0.4) + 'px;flex-shrink:0">' + letter + '</div>';
}

// ── Auth ──────────────────────────────────────────────────────

function renderAuth(mode) {
  mode = mode || 'login';
  var isLogin = mode === 'login';
  document.getElementById('view-auth').innerHTML =
    '<div class="auth-brand">'
    + '<div class="auth-brand-icon">' + icon('leaf', 18, 'var(--paper)', 1.5) + '</div>'
    + '<span class="auth-brand-name">Hábitos</span>'
    + '</div>'
    + '<div class="auth-headline">'
    + (isLogin
      ? '<h1>Bienvenido<br><em>de nuevo</em></h1><p>Accede a tus hábitos y sigue creciendo.</p>'
      : '<h1>Empieza<br><em>hoy mismo</em></h1><p>Crea tu cuenta y construye tus rutinas.</p>')
    + '</div>'
    + '<form class="auth-form-area" onsubmit="handleAuthSubmit(event)">'
    + (isLogin ? '' :
      '<div class="auth-input-row">'
      + '<input id="auth-name" type="text" placeholder="Tu nombre" autocomplete="name" maxlength="60" required />'
      + '</div>')
    + '<div class="auth-input-row">'
    + '<input id="auth-email" type="email" placeholder="Correo electrónico" autocomplete="email" maxlength="254" required />'
    + '</div>'
    + '<div class="auth-input-row">'
    + '<input id="auth-password" type="password" placeholder="Contraseña" autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" minlength="6" maxlength="72" required />'
    + '</div>'
    + '<button class="btn-primary" id="auth-submit-btn" type="submit">' + (isLogin ? 'Entrar' : 'Crear cuenta') + '</button>'
    + '<p id="auth-error" class="auth-error hidden"></p>'
    + '</form>'
    + '<div class="auth-toggle">'
    + (isLogin
      ? '¿No tienes cuenta? <a onclick="switchAuthMode(\'signup\')">Regístrate</a>'
      : '¿Ya tienes cuenta? <a onclick="switchAuthMode(\'login\')">Entra aquí</a>')
    + '</div>';
}

// Tras registrarse con confirmación de correo activada: aún no hay sesión,
// avisar al usuario de que tiene que abrir el enlace del correo.
function renderAuthEmailSent(email) {
  document.getElementById('view-auth').innerHTML =
    '<div class="auth-brand">'
    + '<div class="auth-brand-icon">' + icon('leaf', 18, 'var(--paper)', 1.5) + '</div>'
    + '<span class="auth-brand-name">Hábitos</span>'
    + '</div>'
    + '<div class="auth-confirm">'
    + '<div class="auth-confirm-icon">' + icon('mail', 30, 'var(--accent)', 1.5) + '</div>'
    + '<h1>Revisa tu <em>correo</em></h1>'
    + '<p>Te hemos enviado un enlace de confirmación a<br><strong>' + _esc(email) + '</strong></p>'
    + '<p class="auth-confirm-hint">Ábrelo para activar tu cuenta y después vuelve aquí para entrar. Si no lo ves, mira en la carpeta de spam.</p>'
    + '<button class="btn-primary" onclick="renderAuth(\'login\')" style="margin-top:24px">Ya he confirmado · Entrar</button>'
    + '</div>';
}

// ── Onboarding ────────────────────────────────────────────────

function renderOnboarding(step, picked) {
  step = step || 0;
  picked = picked || [];
  var el = document.getElementById('view-onboarding');
  if (step === 0) {
    el.innerHTML =
      '<div class="onb-wrap">'
      + '<div class="onb-card">'
      + '<div class="onb-hero">' + icon('leaf', 56, 'var(--accent)', 1.3) + '</div>'
      + '<h2 class="onb-title">Bienvenido a Hábitos</h2>'
      + '<p class="onb-body">Construye rutinas que duran. Cada día cuenta.</p>'
      + '<button class="btn-primary" onclick="onboardNext(1)">Empezar</button>'
      + '</div>'
      + '<div class="onb-dots">'
      + '<span class="onb-dot active"></span><span class="onb-dot"></span><span class="onb-dot"></span>'
      + '</div>'
      + '</div>';
  } else if (step === 1) {
    var rows = SUGGESTIONS.map(function(s, i) {
      var sel = picked.indexOf(i) !== -1;
      var c = colorById(s.color);
      return '<button class="onb-suggest' + (sel ? ' selected' : '') + '" onclick="toggleSuggestion(' + i + ')" style="' + (sel ? 'background:' + c.bg + ';border-color:' + c.dot + '' : '') + '">'
        + '<span class="onb-suggest-icon" style="background:' + c.bg + '">' + icon(s.icon, 20, c.ink, 1.7) + '</span>'
        + '<span class="onb-suggest-name">' + s.name + '</span>'
        + (sel ? '<span class="onb-suggest-check">' + icon('check', 16, c.ink, 2) + '</span>' : '')
        + '</button>';
    }).join('');
    el.innerHTML =
      '<div class="onb-wrap">'
      + '<div class="onb-card onb-card--pick">'
      + '<h2 class="onb-title">¿Qué hábitos quieres trabajar?</h2>'
      + '<p class="onb-body">Elige los que te inspiren. Siempre puedes añadir más.</p>'
      + '<div class="onb-suggest-grid">' + rows + '</div>'
      + '<div class="onb-actions">'
      + '<button class="btn-ghost" onclick="skipOnboarding()">Omitir</button>'
      + '<button class="btn-primary" onclick="onboardNext(2)" ' + (picked.length === 0 ? 'disabled' : '') + '>Continuar</button>'
      + '</div>'
      + '</div>'
      + '<div class="onb-dots">'
      + '<span class="onb-dot"></span><span class="onb-dot active"></span><span class="onb-dot"></span>'
      + '</div>'
      + '</div>';
  } else {
    el.innerHTML =
      '<div class="onb-wrap">'
      + '<div class="onb-card">'
      + '<div class="onb-hero">' + icon('sparkle', 56, 'var(--warm)', 1.3) + '</div>'
      + '<h2 class="onb-title">¡Todo listo!</h2>'
      + '<p class="onb-body">Tus hábitos te esperan. ¡Empieza hoy!</p>'
      + '<button class="btn-primary" onclick="finishOnboarding()">Ir a mis hábitos</button>'
      + '</div>'
      + '<div class="onb-dots">'
      + '<span class="onb-dot"></span><span class="onb-dot"></span><span class="onb-dot active"></span>'
      + '</div>'
      + '</div>';
  }
}

// ── Tab bar ───────────────────────────────────────────────────

function renderTabBar(currentTab) {
  function tabBtn(key, label, iconName) {
    return '<button class="tab-item' + (currentTab === key ? ' active' : '') + '" onclick="switchTab(\'' + key + '\')">'
      + icon(iconName, 22, 'currentColor', 1.7)
      + '<span>' + label + '</span>'
      + '</button>';
  }
  document.getElementById('tab-bar').innerHTML =
    '<div class="tab-bar-inner">'
    + tabBtn('home', 'Inicio', 'home')
    + tabBtn('tasks', 'Tareas', 'list')
    + '<div class="tab-fab-space">'
    + '<button class="tab-fab" onclick="openQuickAdd()" aria-label="Añadir">'
    + icon('plus', 24, 'var(--paper)', 2)
    + '</button>'
    + '</div>'
    + tabBtn('shopping', 'Compra', 'cart')
    + tabBtn('habits', 'Hábitos', 'leaf')
    + '</div>';
}

// ── Habits tab (Hoy | Todos) ──────────────────────────────────

function renderHabitsTab(user, habits, allLogs, subTab) {
  subTab = subTab || 'today';
  var header =
    '<div class="page-header">'
    + '<div class="page-header-left">'
    + '<p class="page-date">' + _fmtToday() + '</p>'
    + '<h2 class="page-title">Hábitos</h2>'
    + '</div>'
    + '<button class="avatar-btn" onclick="openProfile()">' + buildAvatar(user, 36) + '</button>'
    + '</div>';

  var seg = buildSegmented([
    { value: 'today', label: 'Hoy' },
    { value: 'all', label: 'Todos' },
  ], subTab, 'setHabitsSubTab');

  var body = subTab === 'today'
    ? buildTodayBody(habits)
    : buildHabitsListBody(habits);

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-habits">'
    + header
    + '<div class="habits-subtabs">' + seg + '</div>'
    + body
    + '</div>';
}

function buildTodayBody(habits) {
  var todayStr = today();
  var scheduled = habits.filter(function(h) { return isScheduledOn(h, new Date()); });
  var done = scheduled.filter(function(h) { return isComplete(h, h.log[todayStr]); }).length;

  var dial = scheduled.length > 0
    ? '<div class="today-dial">' + buildProgressDial(done, scheduled.length) + '<p class="today-dial-label">' + done + ' de ' + scheduled.length + ' completados</p></div>'
    : '';

  var rows = scheduled.length === 0
    ? '<div class="empty-state"><p>No hay hábitos para hoy.<br>Pulsa + para añadir uno.</p></div>'
    : scheduled.map(function(h) { return buildTodayRow(h, h.log[todayStr]); }).join('');

  return dial + '<div class="today-list">' + rows + '</div>';
}

function buildTodayRow(habit, value) {
  var done = isComplete(habit, value);
  var c = colorById(habit.color);
  var streak = calcCurrentStreak(habit);
  var streakBadge = streak > 1
    ? '<span class="streak-badge">' + icon('flame', 12, 'var(--warm)', 1.7) + streak + '</span>'
    : '';
  var sub = '';
  if (habit.type === 'count' || habit.type === 'duration') {
    var val = typeof value === 'number' ? value : 0;
    var target = habit.target || habit.goal || 1;
    sub = '<span class="today-row-sub">' + val + ' / ' + target + (habit.unit ? ' ' + _esc(habit.unit) : '') + '</span>';
  } else {
    sub = '<span class="today-row-sub">' + freqLabel(habit.frequency) + '</span>';
  }
  var check = '<button class="check-btn" onclick="handleCheck(\'' + habit.id + '\')" style="display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;padding:4px;border-radius:50%;flex-shrink:0;-webkit-tap-highlight-color:transparent">'
    + buildCheckCircle(habit, value, 34)
    + '</button>';

  var quickBtn = '';
  if (!done && (habit.type === 'count' || habit.type === 'duration')) {
    var step = getHabitStep(habit);
    quickBtn = '<button class="today-increment-btn" onclick="handleQuickIncrement(\'' + habit.id + '\')" style="background:' + c.bg + ';color:' + c.ink + '">+ ' + step + '</button>';
  }

  var actions = '<div class="today-row-actions">' + quickBtn + check + '</div>';

  return '<div class="today-row' + (done ? ' done' : '') + '" style="' + (done ? '--row-bg:' + c.bg : '') + '">'
    + '<button class="today-row-info" onclick="openDetail(\'' + habit.id + '\')">'
    + buildHabitIcon(habit, done, 40)
    + '<div class="today-row-text">'
    + '<span class="today-row-name">' + _esc(habit.name) + '</span>'
    + '<div class="today-row-meta">' + sub + streakBadge + '</div>'
    + '</div>'
    + '</button>'
    + actions
    + '</div>';
}

function _fmtToday() {
  var d = new Date();
  var dow = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()];
  return dow + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
}

// ── Habits list body ──────────────────────────────────────────

function buildHabitsListBody(habits) {
  var rows = habits.length === 0
    ? '<div class="empty-state"><p>Aún no tienes hábitos.<br>Pulsa + para crear el primero.</p></div>'
    : habits.map(function(h) { return buildHabitListRow(h); }).join('');
  return '<div class="habits-list">' + rows + '</div>';
}

function buildHabitListRow(habit) {
  var c = colorById(habit.color);
  var streak = calcCurrentStreak(habit);
  var streakBadge = streak > 0
    ? '<span class="streak-badge">' + icon('flame', 12, 'var(--warm)', 1.7) + streak + '</span>'
    : '';
  var strip = build7DayStrip(habit);
  return '<button class="habit-row" onclick="openDetail(\'' + habit.id + '\')">'
    + buildHabitIcon(habit, false, 42)
    + '<div class="habit-row-body">'
    + '<div class="habit-row-top">'
    + '<span class="habit-row-name">' + _esc(habit.name) + '</span>'
    + streakBadge
    + '</div>'
    + '<div class="habit-row-meta">' + freqLabel(habit.frequency) + '</div>'
    + '<div class="habit-row-strip">' + strip + '</div>'
    + '</div>'
    + icon('chevronRight', 18, 'var(--ink-mute)', 1.7)
    + '</button>';
}

function build7DayStrip(habit) {
  var cells = '';
  for (var i = 6; i >= 0; i--) {
    var d = daysAgo(i);
    var key = fmtKey(d);
    var val = habit.log[key];
    var done = isComplete(habit, val);
    var scheduled = isScheduledOn(habit, d);
    var c = colorById(habit.color);
    var bg = !scheduled ? 'transparent' : done ? c.dot : 'var(--line)';
    var dow = WEEKDAYS[isoDay(d)];
    cells += '<div class="strip-cell">'
      + '<div class="strip-dot" style="background:' + bg + '"></div>'
      + '<span class="strip-day">' + dow + '</span>'
      + '</div>';
  }
  return cells;
}

// ── Family shared helpers ─────────────────────────────────────

function memberById(members, id) {
  return members.find(function(m) { return m.id === id; }) || null;
}

function buildMemberAvatar(member, size) {
  size = size || 36;
  var c = colorById(memberColor(member));
  var letter = ((member && member.name) || '?').trim().charAt(0).toUpperCase();
  return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + c.bg + ';color:' + c.ink + ';display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-weight:600;font-size:' + Math.round(size * 0.42) + 'px;flex-shrink:0">' + letter + '</div>';
}

function _greetWord() {
  var h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

function taskDueLabel(task) {
  var t = today();
  if (task.due_date < t) return 'Atrasada';
  if (task.due_date === t) return 'Hoy';
  if (task.due_date === tomorrow()) return 'Mañana';
  var d = new Date(task.due_date + 'T00:00:00');
  return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
}

function tasksDueToday(tasks) {
  var t = today();
  return tasks.filter(function(task) { return task.due_date <= t; });
}

// ── Home screen ───────────────────────────────────────────────

function renderHome(profile, family, members, tasks, items, habits) {
  var firstName = ((profile && profile.name) || '').split(' ')[0];
  var me = profile ? { id: profile.id, name: profile.name, color: profile.color } : { id: '', name: 'U' };

  var header =
    '<div class="page-header">'
    + '<div class="page-header-left">'
    + '<p class="page-date">' + _fmtToday() + '</p>'
    + '<h2 class="page-title">' + _greetWord() + (firstName ? ', <em>' + _esc(firstName) + '</em>' : '') + '</h2>'
    + (family ? '<p class="home-family-name">Familia ' + _esc(family.name.replace(/^Familia\s+/i, '')) + '</p>' : '')
    + '</div>'
    + '<button class="avatar-btn" onclick="openProfile()">' + buildMemberAvatar(me, 40) + '</button>'
    + '</div>';

  if (!family) {
    // Sin familia la app funciona igual: el Inicio muestra los hábitos de
    // hoy y la familia se ofrece como opción, no como requisito.
    var todayStr = today();
    var scheduled = (habits || []).filter(function(h) { return isScheduledOn(h, new Date()); });
    var doneHabits = scheduled.filter(function(h) { return isComplete(h, h.log[todayStr]); }).length;

    var soloSection;
    if (scheduled.length > 0) {
      var pendingHabits = scheduled.length - doneHabits;
      var soloHeadline = pendingHabits === 0
        ? '¡Todo hecho!'
        : pendingHabits + (pendingHabits === 1 ? ' hábito por hoy' : ' hábitos por hoy');
      soloSection =
        '<div class="home-card home-dial-card">'
        + buildProgressDial(doneHabits, scheduled.length)
        + '<div class="home-dial-text">'
        + '<p class="home-headline">' + soloHeadline + '</p>'
        + '<p class="home-subline">' + doneHabits + ' de ' + scheduled.length + ' completados hoy</p>'
        + '</div>'
        + '</div>'
        + '<div class="home-section-header">'
        + '<h3 class="section-title" style="padding:0">Hábitos de hoy</h3>'
        + '<button class="text-btn" onclick="switchTab(\'habits\')">Ver todos →</button>'
        + '</div>'
        + '<div class="today-list">' + scheduled.slice(0, 4).map(function(h) { return buildTodayRow(h, h.log[todayStr]); }).join('') + '</div>';
    } else {
      soloSection =
        '<div class="empty-state"><p>Aún no tienes hábitos para hoy.<br>Pulsa + para crear el primero.</p></div>';
    }

    document.getElementById('app-content').innerHTML =
      '<div class="screen screen-home">'
      + header
      + soloSection
      + buildNoFamilyCard()
      + '</div>';
    return;
  }

  // Tareas de hoy
  var todayTasks = tasksDueToday(tasks);
  var doneCount = todayTasks.filter(function(t) { return t.done; }).length;
  var pendingCount = todayTasks.length - doneCount;
  var headline = todayTasks.length === 0
    ? 'Sin tareas hoy'
    : (pendingCount === 0 ? '¡Todo hecho!' : pendingCount + (pendingCount === 1 ? ' tarea por hacer' : ' tareas por hacer'));
  var subline = todayTasks.length === 0
    ? 'Disfrutad el día en familia.'
    : (pendingCount === 0 ? 'La familia ha completado el día.' : doneCount + ' de ' + todayTasks.length + ' completadas hoy');

  var dialCard =
    '<div class="home-card home-dial-card">'
    + buildProgressDial(doneCount, todayTasks.length)
    + '<div class="home-dial-text">'
    + '<p class="home-headline">' + headline + '</p>'
    + '<p class="home-subline">' + subline + '</p>'
    + '</div>'
    + '</div>';

  var previewRows = todayTasks.slice(0, 4).map(function(t) { return buildTaskRow(t, members, true); }).join('');
  var tasksSection = todayTasks.length > 0
    ? '<div class="home-section-header">'
      + '<h3 class="section-title" style="padding:0">Tareas de hoy</h3>'
      + '<button class="text-btn" onclick="switchTab(\'tasks\')">Ver todas →</button>'
      + '</div>'
      + '<div class="task-list">' + previewRows + '</div>'
    : '';

  // Atajo a la compra
  var shopPending = items.filter(function(i) { return !i.checked; }).length;
  var shopSummary = shopPending === 0
    ? 'Lista al día'
    : shopPending + (shopPending === 1 ? ' artículo pendiente' : ' artículos pendientes');
  var shopCard =
    '<button class="home-shortcut" onclick="switchTab(\'shopping\')">'
    + '<span class="home-shortcut-icon">' + icon('cart', 22, '#7a4a2c', 1.7) + '</span>'
    + '<span class="home-shortcut-text">'
    + '<span class="home-shortcut-title">Lista de la compra</span>'
    + '<span class="home-shortcut-sub">' + shopSummary + '</span>'
    + '</span>'
    + icon('chevronRight', 20, 'var(--ink-mute)', 1.7)
    + '</button>';

  // La familia
  var memberRows = members.map(function(m) {
    var pend = tasks.filter(function(t) { return t.assignee_id === m.id && !t.done && t.due_date <= today(); }).length;
    var pendLabel = pend === 0 ? 'al día' : pend + (pend === 1 ? ' tarea' : ' tareas');
    return '<div class="member-row">'
      + buildMemberAvatar(m, 42)
      + '<div class="member-row-text">'
      + '<span class="member-row-name">' + _esc(m.name) + '</span>'
      + '<span class="member-row-sub">Adulto</span>'
      + '</div>'
      + '<span class="member-row-pending">' + pendLabel + '</span>'
      + '</div>';
  }).join('');

  var familySection =
    '<h3 class="section-title">La familia</h3>'
    + '<div class="member-list">'
    + memberRows
    + '<button class="member-row member-manage" onclick="openMembers()">'
    + '<span class="member-manage-icon">' + icon('plus', 20, 'var(--ink-soft)', 1.7) + '</span>'
    + '<span class="member-row-name" style="color:var(--ink-soft);font-weight:500">Gestionar familia · vincular</span>'
    + '</button>'
    + '</div>';

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-home">'
    + header
    + dialCard
    + tasksSection
    + '<div class="home-shortcuts">' + shopCard + '</div>'
    + familySection
    + '</div>';
}

function buildNoFamilyCard() {
  return '<div class="home-card no-family-card">'
    + '<div class="no-family-icon">' + icon('users', 30, 'var(--accent)', 1.5) + '</div>'
    + '<h3 class="no-family-title">¿Compartís casa?</h3>'
    + '<p class="no-family-body">Las tareas y la lista de la compra se comparten dentro de un núcleo familiar. Es opcional: sin familia puedes seguir usando tus hábitos con normalidad.</p>'
    + '<button class="btn-primary" onclick="openCreateFamilySheet()">Crear familia</button>'
    + '<button class="btn-secondary" onclick="openJoinFamilySheet()">Tengo un código</button>'
    + '</div>';
}

// ── Tasks screen ──────────────────────────────────────────────

function renderTasks(family, members, tasks, filter) {
  if (!family) {
    document.getElementById('app-content').innerHTML =
      '<div class="screen screen-tasks">'
      + '<div class="page-header"><h2 class="page-title">Tareas</h2></div>'
      + buildNoFamilyCard()
      + '</div>';
    return;
  }

  var pending = tasks.filter(function(t) { return !t.done; }).length;
  var doneCount = tasks.length - pending;

  var header =
    '<div class="page-header">'
    + '<div class="page-header-left">'
    + '<h2 class="page-title">Tareas</h2>'
    + '<p class="page-date">' + pending + ' pendientes · ' + doneCount + ' hechas</p>'
    + '</div>'
    + '</div>';

  var chips = '<div class="chip-row">'
    + '<button class="chip' + (filter === 'all' ? ' active' : '') + '" onclick="setTaskFilter(\'all\')">Todas</button>'
    + members.map(function(m) {
        return '<button class="chip' + (filter === m.id ? ' active' : '') + '" onclick="setTaskFilter(\'' + m.id + '\')">' + _esc(m.name.split(' ')[0]) + '</button>';
      }).join('')
    + '</div>';

  var visible = filter === 'all' ? tasks.slice() : tasks.filter(function(t) { return t.assignee_id === filter; });
  visible.sort(function(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    return 0;
  });

  var rows = visible.length === 0
    ? '<div class="empty-state"><p>Sin tareas aquí.<br>Pulsa + para crear una.</p></div>'
    : visible.map(function(t) { return buildTaskRow(t, members, false); }).join('');

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-tasks">'
    + header
    + chips
    + '<div class="task-list">' + rows + '</div>'
    + '</div>';
}

function buildTaskRow(task, members, compact) {
  var assignee = memberById(members, task.assignee_id);
  var c = assignee ? colorById(memberColor(assignee)) : colorById('sage');
  var name = assignee ? assignee.name.split(' ')[0] : '—';
  var iconSize = compact ? 38 : 42;

  var iconCircle = '<div class="task-icon" style="width:' + iconSize + 'px;height:' + iconSize + 'px;background:' + c.bg + '">'
    + icon(task.icon || 'check', Math.round(iconSize * 0.5), c.ink, 1.7)
    + '</div>';

  var meta = '<div class="task-row-meta">'
    + '<span class="task-assignee-chip" style="background:' + c.bg + ';color:' + c.ink + '">' + name.charAt(0).toUpperCase() + '</span>'
    + '<span>' + _esc(name) + '</span>'
    + (compact ? '' : '<span class="task-meta-dot">·</span><span class="due-label">' + taskDueLabel(task) + '</span>')
    + (task.template_id ? '<span class="task-repeat-badge">' + icon('repeat', 12, 'currentColor', 1.8) + '</span>' : '')
    + '</div>';

  var check = '<button class="t-check' + (task.done ? ' done' : '') + '" onclick="handleToggleTask(\'' + task.id + '\')" style="' + (task.done ? 'background:' + c.dot + ';border-color:' + c.dot : '') + '" aria-label="Completar">'
    + (task.done ? '<span class="t-check-mark">' + icon('check', 20, '#fff', 2.4) + '</span>' : '')
    + '</button>';

  var delBtn = (!compact && task.done)
    ? '<button class="t-del" onclick="handleDeleteTask(\'' + task.id + '\')" aria-label="Eliminar">' + icon('trash', 16, 'var(--ink-mute)', 1.6) + '</button>'
    : '';

  return '<div class="task-row' + (task.done ? ' done' : '') + '" style="' + (task.done ? '--row-bg:' + c.bg : '') + '">'
    + iconCircle
    + '<div class="task-row-text">'
    + '<span class="task-row-name" style="' + (task.done ? 'color:' + c.ink : '') + '">' + _esc(task.title) + '</span>'
    + meta
    + '</div>'
    + delBtn
    + check
    + '</div>';
}

// ── Shopping screen ───────────────────────────────────────────

function renderShopping(family, members, items) {
  if (!family) {
    document.getElementById('app-content').innerHTML =
      '<div class="screen screen-shopping">'
      + '<div class="page-header"><h2 class="page-title">La compra</h2></div>'
      + buildNoFamilyCard()
      + '</div>';
    return;
  }

  var pending = items.filter(function(i) { return !i.checked; }).length;
  var checked = items.length - pending;
  var summary = items.length === 0
    ? 'Lista vacía'
    : (pending === 0 ? 'Todo comprado' : pending + ' pendientes · ' + checked + ' en el carro');

  var header =
    '<div class="page-header">'
    + '<div class="page-header-left">'
    + '<h2 class="page-title">La compra</h2>'
    + '<p class="page-date">' + summary + '</p>'
    + '</div>'
    + '<span class="badge-shared">Compartida</span>'
    + '</div>';

  var groups = SHOP_CATEGORIES.map(function(cat) {
    var catItems = items.filter(function(i) { return i.category === cat.id; });
    if (catItems.length === 0) return '';
    catItems.sort(function(a, b) { return (a.checked ? 1 : 0) - (b.checked ? 1 : 0); });
    var rows = catItems.map(function(item, idx) {
      var by = memberById(members, item.added_by);
      var byAvatar = by ? buildMemberAvatar(by, 22) : '';
      return '<button class="shop-row' + (item.checked ? ' checked' : '') + '" onclick="handleToggleItem(\'' + item.id + '\')">'
        + '<span class="shop-check' + (item.checked ? ' on' : '') + '">'
        + (item.checked ? icon('check', 14, '#fff', 2.6) : '')
        + '</span>'
        + '<span class="shop-row-text">'
        + '<span class="shop-row-name">' + _esc(item.name) + '</span>'
        + (item.qty ? '<span class="shop-qty">' + _esc(item.qty) + '</span>' : '')
        + '</span>'
        + byAvatar
        + '</button>';
    }).join('');
    return '<div class="shop-group">'
      + '<div class="shop-cat-label">' + cat.label + '</div>'
      + '<div class="shop-card">' + rows + '</div>'
      + '</div>';
  }).join('');

  var empty = items.length === 0
    ? '<div class="empty-state"><p>La lista está vacía.<br>Pulsa + para añadir el primer artículo.</p></div>'
    : '';

  var clearBtn = checked > 0
    ? '<button class="btn-clear-checked" onclick="handleClearChecked()">'
      + icon('trash', 16, 'currentColor', 1.6)
      + 'Quitar ' + checked + (checked === 1 ? ' comprado' : ' comprados')
      + '</button>'
    : '';

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-shopping">'
    + header
    + groups
    + empty
    + clearBtn
    + '</div>';
}

// ── Quick add sheet ───────────────────────────────────────────

function renderQuickAddSheet() {
  function opt(kind, iconName, iconBg, iconInk, title, sub) {
    return '<button class="qa-option" onclick="quickAddPick(\'' + kind + '\')">'
      + '<span class="qa-icon" style="background:' + iconBg + ';color:' + iconInk + '">' + icon(iconName, 22, iconInk, 1.7) + '</span>'
      + '<span class="qa-text"><span class="qa-title">' + title + '</span><span class="qa-sub">' + sub + '</span></span>'
      + '</button>';
  }
  document.getElementById('sheet-quick').innerHTML =
    '<div class="sheet-backdrop" onclick="closeQuickAdd()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Añadir</h3>'
    + '<div class="qa-options">'
    + opt('task', 'list', '#dde5eb', '#3c5468', 'Tarea', 'Asignar a un miembro')
    + opt('item', 'cart', '#ecdfd2', '#7a4a2c', 'Artículo de la compra', 'A la lista compartida')
    + opt('habit', 'leaf', '#e6ebe1', '#445a3c', 'Hábito', 'Privado, solo para ti')
    + '</div>'
    + '</div>';
}

// ── Add task sheet ────────────────────────────────────────────

function renderAddTaskSheet(draft, members) {
  var avatars = members.map(function(m) {
    var sel = draft.assigneeId === m.id;
    return '<button class="avatar-pick' + (sel ? ' active' : '') + '" onclick="setTaskAssignee(\'' + m.id + '\')">'
      + buildMemberAvatar(m, 48)
      + '<span class="avatar-pick-name">' + _esc(m.name.split(' ')[0]) + '</span>'
      + '</button>';
  }).join('');

  var isRecurring = draft.repeat === 'recurring';
  var isToday = !isRecurring && draft.dueDate === today();
  var isTomorrow = !isRecurring && !isToday;
  var whenBtns =
    '<button class="when-btn' + (isToday ? ' active' : '') + '" onclick="setTaskDue(0)">Hoy</button>'
    + '<button class="when-btn' + (isTomorrow ? ' active' : '') + '" onclick="setTaskDue(1)">Mañana</button>'
    + '<button class="when-btn' + (isRecurring ? ' active' : '') + '" onclick="setTaskRepeat()">' + icon('repeat', 15, 'currentColor', 1.8) + ' Repetir</button>';

  var dayPicker = '';
  if (isRecurring) {
    var days = draft.days || [];
    var dayBtns = WEEKDAYS.map(function(d, i) {
      var sel = days.indexOf(i) !== -1;
      return '<button class="day-btn' + (sel ? ' active' : '') + '" onclick="toggleTaskDay(' + i + ')">' + d + '</button>';
    }).join('');
    var hint = days.length === 7 ? 'Cada día' : 'Los días marcados, cada semana';
    dayPicker = '<div class="task-day-picker"><div class="day-picker">' + dayBtns + '</div>'
      + '<p class="task-day-hint">' + hint + '</p></div>';
  }

  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Nueva tarea</h3>'
    + '<input class="input" id="task-title-input" type="text" placeholder="¿Qué hay que hacer?" maxlength="80" value="' + _esc(draft.title || '') + '" oninput="updateTaskTitle(this.value)" />'
    + '<label class="form-label sheet-label">Asignar a</label>'
    + '<div class="avatar-pick-row">' + avatars + '</div>'
    + '<label class="form-label sheet-label">Cuándo</label>'
    + '<div class="when-row">' + whenBtns + '</div>'
    + dayPicker
    + '<button class="btn-primary" id="save-task-btn" onclick="saveTask()" style="opacity:' + ((draft.title || '').trim() ? '1' : '0.4') + ';margin-top:20px">Crear tarea</button>'
    + '</div>';

  var input = document.getElementById('task-title-input');
  if (input && !draft.title) input.focus();
}

// ── Add item sheet ────────────────────────────────────────────

function renderAddItemSheet(draft) {
  var chips = SHOP_CATEGORIES.map(function(c) {
    var sel = draft.category === c.id;
    return '<button class="chip' + (sel ? ' active' : '') + '" onclick="setItemCategory(\'' + c.id + '\')">' + c.label + '</button>';
  }).join('');

  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Añadir a la compra</h3>'
    + '<input class="input" id="item-name-input" type="text" placeholder="p. ej. Leche" maxlength="60" value="' + _esc(draft.name || '') + '" oninput="updateItemName(this.value)" />'
    + '<input class="input" id="item-qty-input" type="text" placeholder="Cantidad (opcional) · p. ej. 2 L" maxlength="20" value="' + _esc(draft.qty || '') + '" oninput="updateItemQty(this.value)" style="margin-top:10px" />'
    + '<label class="form-label sheet-label">Categoría</label>'
    + '<div class="chip-row chip-row-wrap">' + chips + '</div>'
    + '<button class="btn-primary" id="save-item-btn" onclick="saveItem()" style="opacity:' + ((draft.name || '').trim() ? '1' : '0.4') + ';margin-top:20px">Añadir a la lista</button>'
    + '</div>';

  var input = document.getElementById('item-name-input');
  if (input && !draft.name) input.focus();
}

// ── Family sheets ─────────────────────────────────────────────

function renderCreateFamilySheet(defaultName) {
  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Crear familia</h3>'
    + '<p class="sheet-desc">Ponle nombre a vuestro núcleo familiar. Después podrás invitar a los demás.</p>'
    + '<input class="input" id="family-name-input" type="text" placeholder="Nombre de la familia" maxlength="40" value="' + _esc(defaultName || '') + '" />'
    + '<button class="btn-primary" onclick="handleCreateFamily()" style="margin-top:20px">Crear familia</button>'
    + '<button class="btn-ghost" onclick="openJoinFamilySheet()" style="margin-top:8px">Tengo un código de invitación</button>'
    + '</div>';
}

function renderJoinFamilySheet(prefillCode) {
  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Unirme a una familia</h3>'
    + '<p class="sheet-desc">Introduce el código de invitación que te han compartido.</p>'
    + '<input class="input invite-input" id="invite-code-input" type="text" placeholder="FAM-XXXXXX" maxlength="12" autocapitalize="characters" value="' + _esc(prefillCode || '') + '" />'
    + '<button class="btn-primary" onclick="handleJoinFamily()" style="margin-top:20px">Unirme</button>'
    + '<button class="btn-ghost" onclick="openCreateFamilySheet()" style="margin-top:8px">Crear una familia nueva</button>'
    + '</div>';

  var input = document.getElementById('invite-code-input');
  if (input && !prefillCode) input.focus();
}

function renderEditProfileSheet(draft) {
  var swatches = HABIT_COLORS.map(function(c) {
    return '<button class="color-swatch' + (c.id === draft.color ? ' active' : '') + '" onclick="setProfileDraftColor(\'' + c.id + '\')" style="background:' + c.dot + '" title="' + c.id + '"></button>';
  }).join('');
  var preview = buildMemberAvatar({ id: '', name: draft.name || '?', color: draft.color }, 56);

  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Editar perfil</h3>'
    + '<div class="profile-preview">' + preview + '</div>'
    + '<label class="form-label sheet-label">Tu nombre</label>'
    + '<input class="input" id="profile-name-input" type="text" placeholder="Tu nombre" maxlength="60" value="' + _esc(draft.name || '') + '" oninput="updateProfileDraftName(this.value)" />'
    + '<label class="form-label sheet-label">Color de tu avatar</label>'
    + '<div class="color-picker" style="padding:0 22px">' + swatches + '</div>'
    + '<button class="btn-primary" onclick="handleSaveProfile()" style="margin-top:20px">Guardar</button>'
    + '</div>';
}

// "hoy a las 14:30" / "mañana a las 9:05" / "el 3 de agosto a las 14:30"
function _fmtExpiry(iso) {
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  var hh = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  var k = toDateString(d);
  var day;
  if (k === today()) day = 'hoy';
  else if (k === tomorrow()) day = 'mañana';
  else day = 'el ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
  return day + ' a las ' + hh;
}

function renderInviteSheet(inviteInfo, link) {
  var qrBlock = '';
  if (typeof qrcodegen !== 'undefined') {
    qrBlock = '<div class="qr-wrap">' + buildQrSvg(link, 168) + '</div>';
  }
  var exp = _fmtExpiry(inviteInfo.expires_at);
  document.getElementById('sheet-add').innerHTML =
    '<div class="sheet-backdrop" onclick="closeAddSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<h3 class="sheet-title">Invita a tu familia</h3>'
    + '<p class="sheet-desc">Que escaneen el código QR o introduce el código al registrarse.</p>'
    + qrBlock
    + '<div class="invite-code-box">'
    + '<div class="invite-code-text">'
    + '<span class="invite-code-label">Código</span>'
    + '<span class="invite-code">' + _esc(inviteInfo.code) + '</span>'
    + '</div>'
    + '<button class="btn-copy" onclick="handleCopyInviteCode()">' + icon('copy', 15, 'currentColor', 1.7) + 'Copiar</button>'
    + '</div>'
    + '<button class="btn-secondary" onclick="handleCopyInviteLink()" style="margin-top:10px">' + icon('link', 16, 'currentColor', 1.7) + ' Copiar enlace</button>'
    + '<p class="invite-footnote">Sirve para una sola persona: en cuanto alguien se une, deja de valer.'
    + (exp ? ' Caduca ' + exp + '.' : '')
    + '</p>'
    + '<button class="btn-ghost" onclick="handleRegenerateInvite()">Generar código nuevo</button>'
    + '<button class="btn-ghost" onclick="handleRevokeInvite()" style="margin-top:8px;color:var(--danger)">Invalidar este código</button>'
    + '</div>';
}

// ── Members overlay ───────────────────────────────────────────

function renderMembers(family, members, tasks, currentUserId) {
  var t = today();
  var cards = members.map(function(m) {
    var pend = tasks.filter(function(x) { return x.assignee_id === m.id && !x.done; }).length;
    var doneToday = tasks.filter(function(x) { return x.assignee_id === m.id && x.done && x.due_date <= t; }).length;
    var stat = pend + (pend === 1 ? ' tarea pendiente' : ' tareas pendientes') + ' · ' + doneToday + ' hechas hoy';
    return '<div class="member-card">'
      + buildMemberAvatar(m, 48)
      + '<div class="member-card-text">'
      + '<div class="member-card-top">'
      + '<span class="member-row-name">' + _esc(m.name) + (m.id === currentUserId ? ' <span class="member-you">(tú)</span>' : '') + '</span>'
      + '<span class="role-badge">Adulto</span>'
      + '</div>'
      + '<span class="member-row-sub">' + stat + '</span>'
      + '</div>'
      + '</div>';
  }).join('');

  var adults = members.length;
  document.getElementById('overlay-members').innerHTML =
    '<div class="overlay-page">'
    + '<div class="overlay-header">'
    + '<button class="icon-btn" onclick="closeMembers()">' + icon('chevronLeft', 22, 'var(--ink)', 1.7) + '</button>'
    + '<h2 class="overlay-title">La familia</h2>'
    + '<span style="width:38px"></span>'
    + '</div>'
    + '<div class="overlay-body">'
    + '<h2 class="members-family-name">Familia ' + _esc(family.name.replace(/^Familia\s+/i, '')) + '</h2>'
    + '<p class="members-count">' + adults + (adults === 1 ? ' miembro' : ' miembros') + '</p>'
    + '<div class="member-cards">' + cards + '</div>'
    + '<div class="invite-card">'
    + '<h3 class="invite-card-title">Vincular a alguien</h3>'
    + '<p class="invite-card-body">Comparte la lista de la compra y las tareas con otra persona de tu núcleo familiar.</p>'
    + '<button class="btn-primary" onclick="openInviteSheet()">' + icon('qr', 18, 'var(--paper)', 1.7) + ' Código de invitación</button>'
    + '</div>'
    + '<button class="btn-danger" onclick="handleLeaveFamily()" style="margin-top:20px">Salir de la familia</button>'
    + '</div>'
    + '</div>';
}

// ── QR ────────────────────────────────────────────────────────

function buildQrSvg(text, sizePx) {
  sizePx = sizePx || 160;
  try {
    var qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
    var n = qr.size;
    var parts = [];
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        if (qr.getModule(x, y)) parts.push('M' + x + ' ' + y + 'h1v1h-1z');
      }
    }
    return '<svg width="' + sizePx + '" height="' + sizePx + '" viewBox="0 0 ' + n + ' ' + n + '" style="display:block">'
      + '<path d="' + parts.join('') + '" fill="var(--ink)"/>'
      + '</svg>';
  } catch (e) {
    console.warn('buildQrSvg error', e);
    return '';
  }
}

// ── Detail screen ─────────────────────────────────────────────

function renderDetail(habit, allLogs) {
  var c = colorById(habit.color);
  var todayStr = today();
  var todayVal = habit.log[todayStr];
  var done = isComplete(habit, todayVal);
  var streak = calcCurrentStreak(habit);
  var best = calcBestStreak(habit);
  var rate = calcCompletionRate(habit, 30);

  var topAction = buildTodayAction(habit, todayVal);

  document.getElementById('overlay-detail').innerHTML =
    '<div class="overlay-page">'
    + '<div class="overlay-header" style="background:' + c.bg + '">'
    + '<button class="icon-btn" onclick="closeDetail()">' + icon('chevronLeft', 22, c.ink, 1.7) + '</button>'
    + buildHabitIcon(habit, done, 48)
    + '<div class="overlay-header-text">'
    + '<h2 class="overlay-title" style="color:' + c.ink + '">' + _esc(habit.name) + '</h2>'
    + '<p class="overlay-sub" style="color:' + c.ink + ';opacity:.7">' + freqLabel(habit.frequency) + '</p>'
    + '</div>'
    + '<button class="icon-btn" onclick="openEdit(\'' + habit.id + '\')">' + icon('edit', 20, c.ink, 1.7) + '</button>'
    + '</div>'
    + '<div class="overlay-body">'
    + topAction
    + '<div class="stats-trio">'
    + buildStatCard('Racha actual', streak + (streak === 1 ? ' día' : ' días'), 'flame')
    + buildStatCard('Mejor racha', best + (best === 1 ? ' día' : ' días'), 'target')
    + buildStatCard('Este mes', rate + '%', 'hash')
    + '</div>'
    + buildHeatmap(habit)
    + '<h3 class="section-title">Historial reciente</h3>'
    + '<div class="history-list">' + buildHistory(habit) + '</div>'
    + '</div>'
    + '</div>';
}

function buildTodayAction(habit, value) {
  var done = isComplete(habit, value);
  var c = colorById(habit.color);
  if (habit.type === 'binary') {
    return '<div class="today-action">'
      + '<button class="action-check' + (done ? ' done' : '') + '" onclick="handleCheck(\'' + habit.id + '\')" style="' + (done ? 'background:' + c.dot + ';color:#fff' : 'background:' + c.bg + ';color:' + c.ink) + '">'
      + (done ? icon('check', 22, '#fff', 2) + ' Completado' : 'Marcar como hecho')
      + '</button>'
      + '</div>';
  }
  var val = typeof value === 'number' ? value : 0;
  var target = habit.target || habit.goal || 1;
  var unit = _esc(habit.unit || (habit.type === 'duration' ? 'min' : ''));
  var pct = Math.min(val / target, 1);
  return '<div class="today-action">'
    + '<div class="action-counter">'
    + '<button class="counter-btn" onclick="handleDetailDecrement(\'' + habit.id + '\')">' + icon('chevronLeft', 20, 'var(--ink)', 2) + '</button>'
    + '<div class="counter-val">'
    + '<span class="counter-num">' + val + '</span>'
    + '<div class="counter-sub">'
    + (unit ? '<span class="counter-unit">' + unit + '</span>' : '')
    + '<span class="counter-target">/ ' + target + '</span>'
    + '</div>'
    + '</div>'
    + '<button class="counter-btn" onclick="handleDetailIncrement(\'' + habit.id + '\')">' + icon('chevronRight', 20, 'var(--ink)', 2) + '</button>'
    + '</div>'
    + '<div class="action-progress-bar"><div class="action-progress-fill" style="width:' + Math.round(pct*100) + '%;background:' + c.dot + '"></div></div>'
    + '</div>';
}

function buildStatCard(label, value, iconName) {
  return '<div class="stat-card">'
    + '<div class="stat-icon">' + icon(iconName, 18, 'var(--ink-soft)', 1.7) + '</div>'
    + '<div class="stat-val">' + value + '</div>'
    + '<div class="stat-label">' + label + '</div>'
    + '</div>';
}

function buildHeatmap(habit) {
  var weeks = 12;
  var c = colorById(habit.color);
  var TODAY = todayDate();
  var todayWeekday = isoDay(TODAY); // 0=Mon, 6=Sun

  // Total: count of completed days in habit.log (matches prototype)
  var totalDone = 0;
  Object.keys(habit.log).forEach(function(k) {
    if (isComplete(habit, habit.log[k])) totalDone++;
  });

  var cols = [];
  for (var w = weeks - 1; w >= 0; w--) {
    var dayCells = '';
    for (var dow = 0; dow < 7; dow++) {
      // Monday-anchored: rightmost column is current week, future days within current week stay transparent
      var offset = (w * 7) + (todayWeekday - dow);
      var d = daysAgo(offset);
      var key = fmtKey(d);
      var val = habit.log[key];
      var done = isComplete(habit, val);
      var scheduled = isScheduledOn(habit, d);
      var inFuture = d.getTime() > TODAY.getTime();
      var partial = !done && habit.type !== 'binary' && typeof val === 'number' && val > 0;

      var bg, border, opacity;
      if (inFuture || !scheduled) {
        bg = 'transparent';
        border = '1px dashed var(--line-2)';
        opacity = inFuture ? '0.3' : '1';
      } else if (done) {
        bg = c.dot;
        border = 'none';
        opacity = '1';
      } else if (partial) {
        bg = c.bg;
        border = 'none';
        opacity = '1';
      } else {
        bg = 'var(--bg-2)';
        border = 'none';
        opacity = '1';
      }

      dayCells += '<div class="hm-cell" style="background:' + bg + ';border:' + border + ';opacity:' + opacity + '" title="' + key + '"></div>';
    }
    cols.push(dayCells);
  }

  return '<div class="hm-wrap">'
    + '<div class="hm-header">'
    + '<span class="section-title" style="padding:0">Últimas 12 semanas</span>'
    + '<span class="hm-total">' + totalDone + ' total</span>'
    + '</div>'
    + '<div class="hm-body">'
    + '<div class="hm-days">'
    + WEEKDAYS.map(function(d, i) {
        return '<div class="hm-day-lbl" style="visibility:' + (i % 2 === 0 ? 'visible' : 'hidden') + '">' + d + '</div>';
      }).join('')
    + '</div>'
    + '<div class="hm-grid">'
    + cols.map(function(cells) { return '<div class="hm-col">' + cells + '</div>'; }).join('')
    + '</div>'
    + '</div>'
    + '</div>';
}

function buildHistory(habit) {
  var rows = '';
  for (var i = 0; i < 14; i++) {
    var d = daysAgo(i);
    var key = fmtKey(d);
    var val = habit.log[key];
    var done = isComplete(habit, val);
    var scheduled = isScheduledOn(habit, d);
    if (!scheduled) continue;
    var c = colorById(habit.color);
    var label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : WEEKDAYS_LONG[isoDay(d)] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
    var valStr = '';
    if (habit.type === 'binary') {
      valStr = done ? 'Completado' : '—';
    } else {
      valStr = typeof val === 'number' ? val + (habit.unit ? ' ' + _esc(habit.unit) : '') : '—';
    }
    rows += '<div class="history-row">'
      + '<span class="history-date">' + label + '</span>'
      + '<span class="history-val' + (done ? ' done' : '') + '" style="' + (done ? 'color:' + c.dot : '') + '">' + valStr + '</span>'
      + '</div>';
  }
  return rows || '<p class="empty-small">Sin registros recientes.</p>';
}

// ── Create / Edit form ────────────────────────────────────────

function renderCreate(draft, isEditing) {
  var title = isEditing ? 'Editar hábito' : 'Nuevo hábito';
  document.getElementById('overlay-create').innerHTML =
    '<div class="overlay-page">'
    + '<div class="overlay-header">'
    + '<button class="icon-btn" onclick="closeCreate()">' + icon('close', 22, 'var(--ink)', 1.7) + '</button>'
    + '<h2 class="overlay-title">' + title + '</h2>'
    + '<button class="text-btn" onclick="saveHabit()">Guardar</button>'
    + '</div>'
    + '<div class="overlay-body form-body">'
    + '<div class="form-section">'
    + '<label class="form-label">Nombre</label>'
    + '<input class="input" id="draft-name" type="text" placeholder="Nombre del hábito" maxlength="60" value="' + _esc(draft.name || '') + '" oninput="updateDraftName(this.value)" />'
    + '</div>'
    + '<div class="form-section">'
    + '<label class="form-label">Tipo</label>'
    + buildSegmented([
        { value: 'binary', label: 'Hecho/No hecho' },
        { value: 'count', label: 'Cantidad' },
        { value: 'duration', label: 'Duración' },
      ], draft.type || 'binary', 'setDraftType')
    + '</div>'
    + (draft.type !== 'binary'
      ? '<div class="form-section form-row">'
        + '<div class="form-col">'
        + '<label class="form-label">Meta</label>'
        + '<input class="input" id="draft-goal" type="number" min="1" placeholder="10" value="' + (draft.goal || '') + '" oninput="updateDraftTarget(this.value)" />'
        + '</div>'
        + '<div class="form-col">'
        + '<label class="form-label">Unidad</label>'
        + '<input class="input" id="draft-unit" type="text" maxlength="20" placeholder="' + (draft.type === 'duration' ? 'min' : 'veces') + '" value="' + _esc(draft.unit || '') + '" oninput="updateDraftUnit(this.value)" />'
        + '</div>'
        + '</div>'
      : '')
    + '<div class="form-section">'
    + '<label class="form-label">Frecuencia</label>'
    + buildFreqPicker(draft.frequency || { kind: 'daily' })
    + '</div>'
    + '<div class="form-section">'
    + '<label class="form-label">Color</label>'
    + buildColorPicker(draft.color || 'sage')
    + '</div>'
    + '<div class="form-section">'
    + '<label class="form-label">Icono</label>'
    + buildIconPicker(draft.icon || 'leaf')
    + '</div>'
    + (isEditing
      ? '<div class="form-section">'
        + '<button class="btn-danger" onclick="deleteCurrentHabit()">Eliminar hábito</button>'
        + '</div>'
      : '')
    + '</div>'
    + '</div>';
}

function buildSegmented(options, selected, callbackFn) {
  var btns = options.map(function(o) {
    return '<button class="seg-btn' + (o.value === selected ? ' active' : '') + '" onclick="' + callbackFn + '(\'' + o.value + '\')">' + o.label + '</button>';
  }).join('');
  return '<div class="segmented">' + btns + '</div>';
}

function buildFreqPicker(freq) {
  var kindSeg = buildSegmented([
    { value: 'daily', label: 'Diario' },
    { value: 'weekdays', label: 'Días' },
    { value: 'per-week', label: 'Por semana' },
    { value: 'per-month', label: 'Por mes' },
  ], freq.kind || 'daily', 'setDraftFreqKind');

  var sub = buildFreqSub(freq);
  return '<div class="freq-picker">' + kindSeg + sub + '</div>';
}

function buildFreqSub(freq) {
  if (freq.kind === 'weekdays') {
    var days = freq.days || [];
    var btns = WEEKDAYS.map(function(d, i) {
      var sel = days.indexOf(i) !== -1;
      return '<button class="day-btn' + (sel ? ' active' : '') + '" onclick="toggleFreqDay(' + i + ')">' + d + '</button>';
    }).join('');
    return '<div class="day-picker">' + btns + '</div>';
  }
  if (freq.kind === 'per-week' || freq.kind === 'per-month') {
    var label = freq.kind === 'per-week' ? 'veces por semana' : 'veces al mes';
    var max = freq.kind === 'per-week' ? 7 : 31;
    return '<div class="n-picker">'
      + '<button class="counter-btn" onclick="setDraftFreqN(' + (Math.max(1, (freq.n || 1) - 1)) + ')">' + icon('chevronLeft', 18, 'var(--ink)', 2) + '</button>'
      + '<span class="n-val">' + (freq.n || 1) + ' ' + label + '</span>'
      + '<button class="counter-btn" onclick="setDraftFreqN(' + (Math.min(max, (freq.n || 1) + 1)) + ')">' + icon('chevronRight', 18, 'var(--ink)', 2) + '</button>'
      + '</div>';
  }
  return '';
}

function buildColorPicker(selected) {
  var swatches = HABIT_COLORS.map(function(c) {
    return '<button class="color-swatch' + (c.id === selected ? ' active' : '') + '" onclick="setDraftColor(\'' + c.id + '\')" style="background:' + c.dot + '" title="' + c.id + '"></button>';
  }).join('');
  return '<div class="color-picker">' + swatches + '</div>';
}

function buildIconPicker(selected) {
  var btns = ICON_OPTIONS.map(function(name) {
    var sel = name === selected;
    return '<button class="icon-pick' + (sel ? ' active' : '') + '" onclick="setDraftIcon(\'' + name + '\')">' + icon(name, 22, sel ? 'var(--accent)' : 'var(--ink-soft)', 1.7) + '</button>';
  }).join('');
  return '<div class="icon-picker">' + btns + '</div>';
}

// ── Profile sheet ─────────────────────────────────────────────

function renderProfile(user, habits, family, profile) {
  var totalHabits = habits.length;
  var todayStr = today();
  var doneTodayCount = habits.filter(function(h) {
    return isScheduledOn(h, new Date()) && isComplete(h, h.log[todayStr]);
  }).length;
  var name = (profile && profile.name) || (user.user_metadata && user.user_metadata.name) || user.email || 'Usuario';
  var avatar = profile ? buildMemberAvatar(profile, 52) : buildAvatar(user, 52);

  document.getElementById('sheet-profile').innerHTML =
    '<div class="sheet-backdrop" onclick="closeProfile()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<div class="sheet-header">'
    + avatar
    + '<div class="sheet-user-info">'
    + '<p class="sheet-name">' + _esc(name) + '</p>'
    + '<p class="sheet-email">' + _esc(user.email || '') + '</p>'
    + (family ? '<p class="sheet-email">Familia ' + _esc(family.name.replace(/^Familia\s+/i, '')) + '</p>' : '')
    + '</div>'
    + '</div>'
    + '<div class="sheet-stats">'
    + '<div class="sheet-stat"><span class="sheet-stat-val">' + totalHabits + '</span><span class="sheet-stat-label">Hábitos</span></div>'
    + '<div class="sheet-stat"><span class="sheet-stat-val">' + doneTodayCount + '</span><span class="sheet-stat-label">Hoy</span></div>'
    + '</div>'
    + '<div class="sheet-actions">'
    + (profile ? '<button class="sheet-btn" onclick="openEditProfileSheet()">' + icon('pen', 18, 'var(--ink)', 1.7) + '<span>Editar perfil</span></button>' : '')
    + '<button class="sheet-btn" onclick="closeProfile();openMembers()">' + icon('users', 18, 'var(--ink)', 1.7) + '<span>' + (family ? 'Gestionar familia' : 'Crear o unirme a una familia') + '</span></button>'
    + '<button class="sheet-btn" onclick="closeProfile();openCreate()">' + icon('plus', 18, 'var(--ink)', 1.7) + '<span>Nuevo hábito</span></button>'
    + '<button class="sheet-btn" onclick="handleThemeToggle()">' + icon(currentTheme === 'dark' ? 'sun' : 'moon', 18, 'var(--ink)', 1.7) + '<span>' + (currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro') + '</span></button>'
    + ((!isStandalone() && deferredInstallPrompt) ? '<button class="sheet-btn" onclick="handleInstallPWA()">' + icon('phone', 18, 'var(--ink)', 1.7) + '<span>Instalar app</span></button>' : '')
    + ((!isStandalone() && !deferredInstallPrompt && isIOS()) ? '<button class="sheet-btn" onclick="showIOSInstallHint()">' + icon('phone', 18, 'var(--ink)', 1.7) + '<span>Instalar en iPhone</span></button>' : '')
    + '<button class="sheet-btn" onclick="handleShareApp()">' + icon('share', 18, 'var(--ink)', 1.7) + '<span>Compartir la app</span></button>'
    + '<button class="sheet-btn danger" onclick="handleLogout()">' + icon('arrow', 18, 'var(--danger)', 1.7) + '<span>Cerrar sesión</span></button>'
    + '</div>'
    + '</div>';

}

// ── Value sheet ───────────────────────────────────────────────

function renderValueSheet(habit, currentValue) {
  var val = typeof currentValue === 'number' ? currentValue : 0;
  var target = habit.target || habit.goal || 1;
  var unit = _esc(habit.unit || '');
  var c = colorById(habit.color);

  document.getElementById('sheet-value').innerHTML =
    '<div class="sheet-backdrop" onclick="closeValueSheet()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<div class="sheet-header">'
    + buildHabitIcon(habit, false, 40)
    + '<div class="sheet-user-info">'
    + '<p class="sheet-name">' + _esc(habit.name) + '</p>'
    + '<p class="sheet-email">Meta: ' + target + (unit ? ' ' + unit : '') + '</p>'
    + '</div>'
    + '</div>'
    + '<div class="value-input-wrap">'
    + '<button class="counter-btn large" onclick="adjustValue(-1)">' + icon('chevronLeft', 24, 'var(--ink)', 2) + '</button>'
    + '<div class="value-display" id="value-display">'
    + '<span class="value-num" id="value-num">' + val + '</span>'
    + (unit ? '<span class="value-unit">' + unit + '</span>' : '')
    + '</div>'
    + '<button class="counter-btn large" onclick="adjustValue(1)">' + icon('chevronRight', 24, 'var(--ink)', 2) + '</button>'
    + '</div>'
    + '<button class="btn-primary" onclick="confirmValue()" style="background:' + c.dot + '">'
    + 'Guardar'
    + '</button>'
    + '</div>';

}

// ── Toast ─────────────────────────────────────────────────────

function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.onclick = null;
  el.classList.remove('toast-action');
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('visible'); }, 2200);
}

// Aviso persistente de nueva versión: tocar recarga la app
function showUpdateToast() {
  var el = document.getElementById('toast');
  el.textContent = 'Nueva versión disponible · toca para actualizar';
  el.onclick = function() { location.reload(); };
  el.classList.add('visible', 'toast-action');
  clearTimeout(el._t);
  el._t = setTimeout(function() {
    el.classList.remove('visible', 'toast-action');
    el.onclick = null;
  }, 12000);
}

// ── View routing ──────────────────────────────────────────────

function showView(name) {
  ['view-auth','view-onboarding','view-app'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== name);
  });
}

function showOverlay(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  requestAnimationFrame(function() { el.classList.add('active'); });
}

function hideOverlay(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  setTimeout(function() { el.classList.add('hidden'); }, 300);
}

// ── Utility ───────────────────────────────────────────────────

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
