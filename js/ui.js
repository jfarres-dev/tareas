// ============================================================
// UI: rendering functions
// ============================================================

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

let currentViewMode = 'grid'; // 'grid' | 'list'

function setViewMode(mode) {
  currentViewMode = mode;
  const container = document.getElementById('habits-container');
  container.className = mode === 'grid' ? 'habits-grid' : 'habits-list';
  document.getElementById('btn-view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
}

// ---- Dot grid builder ----
function buildDotGrid(dates, logsMap, isTodayClickable, onDotClick) {
  const grid = document.createElement('div');
  grid.className = 'dot-grid';
  const todayStr = today();

  for (const dateStr of dates) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    const log = logsMap[dateStr];
    if (log?.completed) dot.classList.add('done');
    if (dateStr === todayStr) dot.classList.add('today');
    if (onDotClick && dateStr <= todayStr) {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', (e) => { e.stopPropagation(); onDotClick(dateStr); });
    }
    grid.appendChild(dot);
  }
  return grid;
}

// ---- Card: grid mode ----
function renderCardGrid(habit, logsMap, onCheck, onDotClick, onCardClick) {
  const card = document.createElement('div');
  card.className = 'habit-card';
  card.style.background = habit.color;

  const dates = buildDateRange(60);
  const todayStr = today();
  const todayLog = logsMap[todayStr];
  const isDone = todayLog?.completed || false;

  const top = document.createElement('div');
  top.className = 'card-top';

  const left = document.createElement('div');
  left.className = 'card-left';
  left.innerHTML = `<span class="card-icon">${habit.icon}</span><span class="card-name">${escHtml(habit.name)}</span>`;

  const checkBtn = document.createElement('button');
  checkBtn.className = 'card-check' + (isDone ? ' done' : '');
  checkBtn.innerHTML = isDone
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
    : '';
  checkBtn.addEventListener('click', (e) => { e.stopPropagation(); onCheck(habit, todayStr); });

  top.appendChild(left);
  top.appendChild(checkBtn);

  const dotGrid = buildDotGrid(dates, logsMap, true, (dateStr) => onDotClick(habit, dateStr));

  card.appendChild(top);

  if (habit.type === 'count' && habit.goal) {
    const value = todayLog?.value || 0;
    const pct = Math.min(100, Math.round((value / habit.goal) * 100));
    const progress = document.createElement('div');
    progress.className = 'card-progress';
    progress.innerHTML = `
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="progress-label">${value} / ${habit.goal}</div>
    `;
    card.appendChild(progress);
  }

  card.appendChild(dotGrid);
  card.addEventListener('click', () => onCardClick(habit));
  return card;
}

// ---- Card: list mode ----
function renderCardList(habit, logsMap, onCheck, onCardClick) {
  const card = document.createElement('div');
  card.className = 'habit-card-list';
  card.style.background = habit.color;

  const todayStr = today();
  const isDone = logsMap[todayStr]?.completed || false;

  card.innerHTML = `<span class="list-icon">${habit.icon}</span><span class="list-name">${escHtml(habit.name)}</span>`;

  const listDots = document.createElement('div');
  listDots.className = 'list-dots';
  const recent7 = buildDateRange(7);
  for (const d of recent7) {
    const dot = document.createElement('div');
    dot.className = 'list-dot' + (logsMap[d]?.completed ? ' done' : '');
    listDots.appendChild(dot);
  }

  const checkBtn = document.createElement('button');
  checkBtn.className = 'card-check' + (isDone ? ' done' : '');
  checkBtn.style.flexShrink = '0';
  checkBtn.innerHTML = isDone
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
    : '';
  checkBtn.addEventListener('click', (e) => { e.stopPropagation(); onCheck(habit, todayStr); });

  card.appendChild(listDots);
  card.appendChild(checkBtn);
  card.addEventListener('click', () => onCardClick(habit));
  return card;
}

// ---- Render all habits ----
function renderHabits(habits, allLogs, onCheck, onDotClick, onCardClick) {
  const container = document.getElementById('habits-container');
  container.innerHTML = '';

  if (habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🌱</span>
        <p>No tienes hábitos todavía.</p>
        <p>Pulsa <strong>+</strong> para añadir el primero.</p>
      </div>`;
    return;
  }

  for (const habit of habits) {
    const logsMap = {};
    for (const log of (allLogs || [])) {
      if (log.habit_id === habit.id) logsMap[log.log_date] = log;
    }

    let card;
    if (currentViewMode === 'grid') {
      card = renderCardGrid(habit, logsMap, onCheck, onDotClick, onCardClick);
    } else {
      card = renderCardList(habit, logsMap, onCheck, onCardClick);
    }
    container.appendChild(card);
  }
}

// ---- Detail view ----
function renderDetail(habit, logs, range) {
  document.getElementById('detail-icon').textContent = habit.icon;
  document.getElementById('detail-name').textContent = habit.name;

  const days = range === 'week' ? 7 : 35;
  const dates = buildDateRange(days);
  const logsMap = {};
  for (const l of logs) logsMap[l.log_date] = l;

  const gridWrap = document.getElementById('detail-grid');
  gridWrap.innerHTML = '';
  const grid = buildDotGrid(dates, logsMap, true, null);
  grid.style.setProperty('--dot-size', '14px');
  grid.style.setProperty('--dot-gap', '4px');
  gridWrap.appendChild(grid);

  const stats = calcStats(logs, habit.created_at);
  document.getElementById('detail-stats').innerHTML = `
    <div class="stat-card">
      <span class="stat-icon">🔥</span>
      <span class="stat-value">${stats.streak}</span>
      <span class="stat-label">Racha actual</span>
    </div>
    <div class="stat-card">
      <span class="stat-icon">⏱️</span>
      <span class="stat-value">${stats.daysSinceStart}</span>
      <span class="stat-label">Días desde inicio</span>
    </div>
    <div class="stat-card">
      <span class="stat-icon">✅</span>
      <span class="stat-value">${stats.completions}</span>
      <span class="stat-label">Completados</span>
    </div>
    <div class="stat-card">
      <span class="stat-icon">❌</span>
      <span class="stat-value">${stats.missedDays}</span>
      <span class="stat-label">Días perdidos</span>
    </div>
  `;
}

// ---- Modal: open/close ----
function openHabitModal(habit = null) {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('habit-name');
  const goalInput = document.getElementById('habit-goal');
  const goalField = document.getElementById('goal-field');

  title.textContent = habit ? 'Editar hábito' : 'Nuevo hábito';
  nameInput.value = habit?.name || '';
  goalInput.value = habit?.goal || '';
  goalField.style.display = habit?.type === 'count' ? 'flex' : 'none';

  renderIconPicker(habit?.icon || ICONS[0]);
  renderColorPicker(habit?.color || COLORS[0]);
  setTypeBtn(habit?.type || 'binary');

  modal.classList.add('active');
  nameInput.focus();
}

function closeHabitModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

// ---- Icon picker ----
function renderIconPicker(selected) {
  const picker = document.getElementById('icon-picker');
  picker.innerHTML = '';
  for (const icon of ICONS) {
    const el = document.createElement('span');
    el.className = 'icon-option' + (icon === selected ? ' selected' : '');
    el.textContent = icon;
    el.addEventListener('click', () => {
      picker.querySelectorAll('.icon-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    });
    picker.appendChild(el);
  }
}

function getSelectedIcon() {
  return document.querySelector('.icon-option.selected')?.textContent || ICONS[0];
}

// ---- Color picker ----
function renderColorPicker(selected) {
  const picker = document.getElementById('color-picker');
  picker.innerHTML = '';
  for (const color of COLORS) {
    const el = document.createElement('div');
    el.className = 'color-option' + (color === selected ? ' selected' : '');
    el.style.background = color;
    el.addEventListener('click', () => {
      picker.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    });
    picker.appendChild(el);
  }
}

function getSelectedColor() {
  const sel = document.querySelector('.color-option.selected');
  return sel?.style.background || COLORS[0];
}

// ---- Type toggle ----
function setTypeBtn(type) {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  document.getElementById('goal-field').style.display = type === 'count' ? 'flex' : 'none';
}

function getSelectedType() {
  return document.querySelector('.type-btn.active')?.dataset.type || 'binary';
}

// ---- Count modal ----
function openCountModal(habit, currentValue, onSave) {
  const overlay = document.getElementById('count-modal-overlay');
  const titleEl = document.getElementById('count-modal-title');
  const valueInput = document.getElementById('count-value');
  const goalLabel = document.getElementById('count-goal-label');

  titleEl.textContent = `${habit.icon} ${habit.name}`;
  valueInput.value = currentValue || 0;
  goalLabel.textContent = habit.goal ? `Meta: ${habit.goal}` : '';

  overlay.classList.add('active');
  valueInput.focus();
  valueInput.select();

  document.getElementById('btn-save-count').onclick = () => {
    onSave(parseInt(valueInput.value) || 0);
    overlay.classList.remove('active');
  };
}

function closeCountModal() {
  document.getElementById('count-modal-overlay').classList.remove('active');
}

// ---- Toast ----
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ---- Util ----
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSpinner(containerId) {
  document.getElementById(containerId).innerHTML = '<div class="spinner"></div>';
}
