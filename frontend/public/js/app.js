const API_URL = 'https://todo-app-1-w0o2.onrender.com/api/todos';

const state = { todos: [], search: '', priority: '', category: '', hideCompleted: false, draggedId: null };

const form = document.getElementById('todo-form');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');

// ==== Theme ====
const initTheme = () => {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
};
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ==== Fetch ====
const fetchTodos = async () => {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = 'login.html'; return; }
  const { data } = await res.json();
  state.todos = data;
  updateCategoryOptions();
  render();
};

const updateCategoryOptions = () => {
  const categories = [...new Set(state.todos.map((t) => t.category).filter(Boolean))];
  document.getElementById('category-list').innerHTML = categories.map((c) => `<option value="${c}"></option>`).join('');
  const filterSelect = document.getElementById('filter-category');
  const current = filterSelect.value;
  filterSelect.innerHTML = '<option value="">كل التصنيفات</option>' + categories.map((c) => `<option value="${c}">${c}</option>`).join('');
  filterSelect.value = current;
};

// ==== Filtering & Stats ====
const getFilteredTodos = () =>
  state.todos.filter((t) => {
    const q = state.search.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    return matchesSearch
      && (!state.priority || t.priority === state.priority)
      && (!state.category || t.category === state.category)
      && (!state.hideCompleted || !t.completed);
  });

const renderStats = () => {
  const total = state.todos.length;
  const done = state.todos.filter((t) => t.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = total - done;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-text').textContent = `${percent}% مكتمل`;
};

// ==== Render ====
const priorityLabel = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
const isOverdue = (t) => t.dueDate && !t.completed && new Date(t.dueDate) < new Date(new Date().toDateString());
const escapeHtml = (str = '') => str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const render = () => {
  renderStats();
  const todos = getFilteredTodos();
  list.innerHTML = '';
  emptyState.hidden = todos.length > 0;

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `index-card priority-${todo.priority} ${todo.completed ? 'completed' : ''} ${isOverdue(todo) ? 'overdue' : ''}`;
    li.draggable = true;
    li.dataset.id = todo._id;

    li.innerHTML = `
      <div class="card-main">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} />
        <div class="card-body">
          <div class="card-title">${escapeHtml(todo.title)}</div>
          ${todo.description ? `<div class="card-desc">${escapeHtml(todo.description)}</div>` : ''}
          <div class="card-meta">
            <span>${priorityLabel[todo.priority]}</span>
            ${todo.category ? `<span>${escapeHtml(todo.category)}</span>` : ''}
            ${todo.dueDate ? `<span class="badge-date">${new Date(todo.dueDate).toLocaleDateString('ar-EG')}</span>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn-edit">تعديل</button>
            <button class="btn-delete">حذف</button>
          </div>
        </div>
      </div>`;

    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => updateTodo(todo._id, { completed: e.target.checked }));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteTodo(todo._id));
    li.querySelector('.btn-edit').addEventListener('click', () => enterEditMode(li, todo));

    li.addEventListener('dragstart', () => { state.draggedId = todo._id; li.classList.add('dragging'); });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => { e.preventDefault(); li.classList.remove('drag-over'); handleDrop(todo._id); });

    list.appendChild(li);
  });
};

// ==== Edit mode ====
const enterEditMode = (li, todo) => {
  li.innerHTML = `
    <div class="edit-form">
      <input type="text" class="edit-title" value="${escapeHtml(todo.title)}" />
      <textarea class="edit-description" rows="2">${escapeHtml(todo.description || '')}</textarea>
      <select class="edit-priority">
        <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>منخفضة</option>
        <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>متوسطة</option>
        <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>عالية</option>
      </select>
      <input type="date" class="edit-dueDate" value="${todo.dueDate ? todo.dueDate.slice(0, 10) : ''}" />
      <input type="text" class="edit-category" value="${escapeHtml(todo.category || '')}" />
      <div class="edit-actions">
        <button class="btn-save">حفظ</button>
        <button class="btn-cancel">إلغاء</button>
      </div>
    </div>`;

  li.querySelector('.btn-save').addEventListener('click', () => {
    const updated = {
      title: li.querySelector('.edit-title').value.trim(),
      description: li.querySelector('.edit-description').value.trim(),
      priority: li.querySelector('.edit-priority').value,
      dueDate: li.querySelector('.edit-dueDate').value || null,
      category: li.querySelector('.edit-category').value.trim() || 'عام',
    };
    if (!updated.title) return;
    updateTodo(todo._id, updated);
  });
  li.querySelector('.btn-cancel').addEventListener('click', render);
};

// ==== Drag reorder ====
const handleDrop = async (targetId) => {
  if (!state.draggedId || state.draggedId === targetId) return;
  const fromIndex = state.todos.findIndex((t) => t._id === state.draggedId);
  const toIndex = state.todos.findIndex((t) => t._id === targetId);
  const [moved] = state.todos.splice(fromIndex, 1);
  state.todos.splice(toIndex, 0, moved);
  render();
  const items = state.todos.map((t, i) => ({ id: t._id, order: i }));
  await fetch(`${API_URL}/reorder`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ items }),
  });
};

// ==== CRUD ====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('input-title').value.trim(),
    description: document.getElementById('input-description').value.trim(),
    priority: document.getElementById('input-priority').value,
    dueDate: document.getElementById('input-dueDate').value || null,
    category: document.getElementById('input-category').value.trim() || 'عام',
  };
  if (!payload.title) return;
  await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
  form.reset();
  document.getElementById('input-priority').value = 'medium';
  fetchTodos();
});

const updateTodo = async (id, updates) => {
  await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updates) });
  fetchTodos();
};

const deleteTodo = async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  fetchTodos();
};

// ==== Filters ====
document.getElementById('search-input').addEventListener('input', (e) => { state.search = e.target.value; render(); });
document.getElementById('filter-priority').addEventListener('change', (e) => { state.priority = e.target.value; render(); });
document.getElementById('filter-category').addEventListener('change', (e) => { state.category = e.target.value; render(); });
document.getElementById('filter-hide-completed').addEventListener('change', (e) => { state.hideCompleted = e.target.checked; render(); });

// ==== Init ====
initTheme();
fetchTodos();


// ==== حماية الطلبات + تسجيل الخروج ====
const token = localStorage.getItem('token');

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
});