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
    '<div class="auth-bg">'
    + '<div class="auth-card">'
    + '<div class="auth-brand">'
    + icon('leaf', 36, 'var(--accent)', 1.5)
    + '<h1 class="auth-title">Hábitos</h1>'
    + '<p class="auth-sub">Tu espacio para crecer cada día</p>'
    + '</div>'
    + '<form class="auth-form" onsubmit="handleAuthSubmit(event)">'
    + (isLogin ? '' : '<input class="input" type="text" id="auth-name" placeholder="Tu nombre" autocomplete="name" />')
    + '<input class="input" type="email" id="auth-email" placeholder="Correo electrónico" autocomplete="email" required />'
    + '<input class="input" type="password" id="auth-password" placeholder="Contraseña" autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" required />'
    + '<button class="btn-primary" type="submit">' + (isLogin ? 'Entrar' : 'Crear cuenta') + '</button>'
    + '</form>'
    + '<p class="auth-switch">'
    + (isLogin ? '¿No tienes cuenta? <button class="link-btn" onclick="switchAuthMode(\'signup\')">Regístrate</button>'
               : '¿Ya tienes cuenta? <button class="link-btn" onclick="switchAuthMode(\'login\')">Entra aquí</button>')
    + '</p>'
    + '<p id="auth-error" class="auth-error hidden"></p>'
    + '</div>'
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
      + '<button class="btn-ghost" onclick="onboardNext(2)">Omitir</button>'
      + '<button class="btn-primary" onclick="onboardNext(2)" ' + (picked.length === 0 ? 'style="opacity:.5"' : '') + '>Continuar</button>'
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
  document.getElementById('tab-bar').innerHTML =
    '<div class="tab-bar-inner">'
    + '<button class="tab-item' + (currentTab === 'today' ? ' active' : '') + '" onclick="switchTab(\'today\')">'
    + icon('sun', 22, 'currentColor', 1.7)
    + '<span>Hoy</span>'
    + '</button>'
    + '<div class="tab-fab-space">'
    + '<button class="tab-fab" onclick="openCreate()" aria-label="Nuevo hábito">'
    + icon('plus', 24, '#fff', 2)
    + '</button>'
    + '</div>'
    + '<button class="tab-item' + (currentTab === 'habits' ? ' active' : '') + '" onclick="switchTab(\'habits\')">'
    + icon('list', 22, 'currentColor', 1.7)
    + '<span>Hábitos</span>'
    + '</button>'
    + '</div>';
}

// ── Today screen ──────────────────────────────────────────────

function renderToday(user, habits, allLogs) {
  var todayStr = today();
  var scheduled = habits.filter(function(h) { return isScheduledOn(h, new Date()); });
  var done = scheduled.filter(function(h) { return isComplete(h, h.log[todayStr]); }).length;

  var header =
    '<div class="page-header">'
    + '<div class="page-header-left">'
    + '<p class="page-date">' + _fmtToday() + '</p>'
    + '<h2 class="page-title">Buenos días' + (user && user.user_metadata && user.user_metadata.name ? ', ' + user.user_metadata.name.split(' ')[0] : '') + '</h2>'
    + '</div>'
    + '<button class="avatar-btn" onclick="openProfile()">' + buildAvatar(user, 36) + '</button>'
    + '</div>';

  var dial = scheduled.length > 0
    ? '<div class="today-dial">' + buildProgressDial(done, scheduled.length) + '<p class="today-dial-label">' + done + ' de ' + scheduled.length + ' completados</p></div>'
    : '';

  var rows = scheduled.length === 0
    ? '<div class="empty-state"><p>No hay hábitos para hoy.<br>Pulsa + para añadir uno.</p></div>'
    : scheduled.map(function(h) { return buildTodayRow(h, h.log[todayStr]); }).join('');

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-today">'
    + header
    + dial
    + '<div class="today-list">' + rows + '</div>'
    + '</div>';
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
    sub = '<span class="today-row-sub">' + val + ' / ' + target + (habit.unit ? ' ' + habit.unit : '') + '</span>';
  } else {
    sub = '<span class="today-row-sub">' + freqLabel(habit.frequency) + '</span>';
  }
  var check = '<button class="check-btn" onclick="handleCheck(\'' + habit.id + '\')" style="display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;padding:4px;border-radius:50%;flex-shrink:0;-webkit-tap-highlight-color:transparent">'
    + buildCheckCircle(habit, value, 34)
    + '</button>';
  return '<div class="today-row' + (done ? ' done' : '') + '" style="' + (done ? '--row-bg:' + c.bg : '') + '">'
    + '<button class="today-row-info" onclick="openDetail(\'' + habit.id + '\')">'
    + buildHabitIcon(habit, done, 40)
    + '<div class="today-row-text">'
    + '<span class="today-row-name">' + _esc(habit.name) + '</span>'
    + '<div class="today-row-meta">' + sub + streakBadge + '</div>'
    + '</div>'
    + '</button>'
    + check
    + '</div>';
}

function _fmtToday() {
  var d = new Date();
  var dow = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()];
  return dow + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
}

// ── Habits list screen ────────────────────────────────────────

function renderHabitsList(user, habits, allLogs) {
  var header =
    '<div class="page-header">'
    + '<h2 class="page-title">Mis hábitos</h2>'
    + '<button class="avatar-btn" onclick="openProfile()">' + buildAvatar(user, 36) + '</button>'
    + '</div>';

  var rows = habits.length === 0
    ? '<div class="empty-state"><p>Aún no tienes hábitos.<br>Pulsa + para crear el primero.</p></div>'
    : habits.map(function(h) { return buildHabitListRow(h); }).join('');

  document.getElementById('app-content').innerHTML =
    '<div class="screen screen-habits">'
    + header
    + '<div class="habits-list">' + rows + '</div>'
    + '</div>';
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
  var unit = habit.unit || (habit.type === 'duration' ? 'min' : '');
  var pct = Math.min(val / target, 1);
  var step = habit.type === 'duration' ? 5 : 1;
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
      valStr = typeof val === 'number' ? val + (habit.unit ? ' ' + habit.unit : '') : '—';
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
    + '<input class="input" id="draft-name" type="text" placeholder="Nombre del hábito" value="' + _esc(draft.name || '') + '" oninput="updateDraftName(this.value)" />'
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
        + '<input class="input" id="draft-unit" type="text" placeholder="' + (draft.type === 'duration' ? 'min' : 'veces') + '" value="' + _esc(draft.unit || '') + '" oninput="updateDraftUnit(this.value)" />'
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

function renderProfile(user, habits) {
  var totalHabits = habits.length;
  var todayStr = today();
  var doneTodayCount = habits.filter(function(h) {
    return isScheduledOn(h, new Date()) && isComplete(h, h.log[todayStr]);
  }).length;
  var name = (user.user_metadata && user.user_metadata.name) || user.email || 'Usuario';

  document.getElementById('sheet-profile').innerHTML =
    '<div class="sheet-backdrop" onclick="closeProfile()"></div>'
    + '<div class="sheet">'
    + '<div class="sheet-handle"></div>'
    + '<div class="sheet-header">'
    + buildAvatar(user, 52)
    + '<div class="sheet-user-info">'
    + '<p class="sheet-name">' + _esc(name) + '</p>'
    + '<p class="sheet-email">' + _esc(user.email || '') + '</p>'
    + '</div>'
    + '</div>'
    + '<div class="sheet-stats">'
    + '<div class="sheet-stat"><span class="sheet-stat-val">' + totalHabits + '</span><span class="sheet-stat-label">Hábitos</span></div>'
    + '<div class="sheet-stat"><span class="sheet-stat-val">' + doneTodayCount + '</span><span class="sheet-stat-label">Hoy</span></div>'
    + '</div>'
    + '<div class="sheet-actions">'
    + '<button class="sheet-btn" onclick="closeProfile();openCreate()">' + icon('plus', 18, 'var(--ink)', 1.7) + '<span>Nuevo hábito</span></button>'
    + '<button class="sheet-btn danger" onclick="handleLogout()">' + icon('arrow', 18, 'var(--danger)', 1.7) + '<span>Cerrar sesión</span></button>'
    + '</div>'
    + '</div>';

}

// ── Value sheet ───────────────────────────────────────────────

function renderValueSheet(habit, currentValue) {
  var val = typeof currentValue === 'number' ? currentValue : 0;
  var target = habit.target || habit.goal || 1;
  var unit = habit.unit || '';
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
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('visible'); }, 2200);
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
