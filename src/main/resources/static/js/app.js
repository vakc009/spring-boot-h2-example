'use strict';

const API = '/api/tutorials';

// ── State ──────────────────────────────────────────────────────────────────
let tutorials = [];
let editingId = null;

// ── DOM refs ───────────────────────────────────────────────────────────────
const tableBody        = document.getElementById('table-body');
const emptyState       = document.getElementById('empty-state');
const searchInput      = document.getElementById('search-input');
const publishedToggle  = document.getElementById('published-toggle');
const totalEl          = document.getElementById('stat-total');
const publishedEl      = document.getElementById('stat-published');
const unpublishedEl    = document.getElementById('stat-unpublished');
const modalEl          = document.getElementById('tutorialModal');
const modalTitle       = document.getElementById('modal-title');
const formTitle        = document.getElementById('form-title');
const formDesc         = document.getElementById('form-desc');
const formPublished    = document.getElementById('form-published');
const saveBtn          = document.getElementById('save-btn');
const deleteAllBtn     = document.getElementById('delete-all-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const toastContainer   = document.getElementById('toast-container');

const bsModal        = new bootstrap.Modal(modalEl);
const bsDeleteModal  = new bootstrap.Modal(document.getElementById('deleteModal'));

// ── API helpers ────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadTutorials(title = '', publishedOnly = false) {
  try {
    let url;
    if (publishedOnly) {
      url = `${API}/published`;
    } else if (title) {
      url = `${API}?title=${encodeURIComponent(title)}`;
    } else {
      url = API;
    }
    tutorials = await apiFetch(url);
    renderTable(tutorials);
    updateStats(tutorials);
  } catch (e) {
    showToast('Failed to load tutorials: ' + e.message, 'danger');
  }
}

async function createTutorial(data) {
  try {
    await apiFetch(API, { method: 'POST', body: JSON.stringify(data) });
    showToast('Tutorial created!', 'success');
    reload();
  } catch (e) {
    showToast('Create failed: ' + e.message, 'danger');
  }
}

async function updateTutorial(id, data) {
  try {
    await apiFetch(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('Tutorial updated!', 'success');
    reload();
  } catch (e) {
    showToast('Update failed: ' + e.message, 'danger');
  }
}

async function deleteTutorial(id) {
  try {
    await apiFetch(`${API}/${id}`, { method: 'DELETE' });
    showToast('Tutorial deleted.', 'success');
    reload();
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'danger');
  }
}

async function deleteAll() {
  try {
    await apiFetch(API, { method: 'DELETE' });
    showToast('All tutorials deleted.', 'success');
    reload();
  } catch (e) {
    showToast('Delete all failed: ' + e.message, 'danger');
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────
function renderTable(list) {
  tableBody.innerHTML = '';
  if (!list || list.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }
  emptyState.classList.add('d-none');

  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-muted" style="width:60px">${t.id}</td>
      <td><strong>${escHtml(t.title)}</strong></td>
      <td class="text-muted">${escHtml(t.description || '')}</td>
      <td>
        <span class="${t.published ? 'badge-published' : 'badge-draft'}">
          ${t.published ? 'Published' : 'Draft'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline-primary btn-action me-1" onclick="openModal(${t.id})" title="Edit">
          <i class="fa fa-pencil"></i>
        </button>
        <button class="btn btn-outline-${t.published ? 'warning' : 'success'} btn-action me-1"
                onclick="togglePublished(${t.id}, ${t.published})"
                title="${t.published ? 'Unpublish' : 'Publish'}">
          <i class="fa fa-${t.published ? 'eye-slash' : 'eye'}"></i>
        </button>
        <button class="btn btn-outline-danger btn-action" onclick="confirmDelete(${t.id})" title="Delete">
          <i class="fa fa-trash"></i>
        </button>
      </td>`;
    tableBody.appendChild(tr);
  });
}

function updateStats(list) {
  const total = list ? list.length : 0;
  const published = list ? list.filter(t => t.published).length : 0;
  totalEl.textContent = total;
  publishedEl.textContent = published;
  unpublishedEl.textContent = total - published;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  formTitle.value = '';
  formDesc.value = '';
  formPublished.checked = false;

  if (id !== null) {
    const t = tutorials.find(x => x.id === id);
    if (t) {
      modalTitle.textContent = 'Edit Tutorial';
      formTitle.value = t.title || '';
      formDesc.value = t.description || '';
      formPublished.checked = !!t.published;
    }
  } else {
    modalTitle.textContent = 'Add Tutorial';
  }
  bsModal.show();
}

saveBtn.addEventListener('click', () => {
  const title = formTitle.value.trim();
  if (!title) {
    formTitle.classList.add('is-invalid');
    return;
  }
  formTitle.classList.remove('is-invalid');

  const data = {
    title,
    description: formDesc.value.trim(),
    published: formPublished.checked,
  };

  bsModal.hide();
  if (editingId !== null) {
    updateTutorial(editingId, data);
  } else {
    createTutorial(data);
  }
});

// clear validation state when modal closes
modalEl.addEventListener('hidden.bs.modal', () => {
  formTitle.classList.remove('is-invalid');
});

// ── Delete confirmation ────────────────────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  bsDeleteModal.show();
}

confirmDeleteBtn.addEventListener('click', () => {
  bsDeleteModal.hide();
  if (pendingDeleteId !== null) {
    deleteTutorial(pendingDeleteId);
    pendingDeleteId = null;
  }
});

// ── Toggle published ───────────────────────────────────────────────────────
function togglePublished(id, currentPublished) {
  const t = tutorials.find(x => x.id === id);
  if (!t) return;
  updateTutorial(id, { title: t.title, description: t.description, published: !currentPublished });
}

// ── Delete all ─────────────────────────────────────────────────────────────
deleteAllBtn.addEventListener('click', () => {
  if (tutorials.length === 0) return;
  if (confirm('Delete ALL tutorials? This cannot be undone.')) {
    deleteAll();
  }
});

// ── Search (debounced) ─────────────────────────────────────────────────────
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    reload();
  }, 300);
});

publishedToggle.addEventListener('change', () => reload());

function reload() {
  loadTutorials(searchInput.value.trim(), publishedToggle.checked);
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const id = 'toast-' + Date.now();
  const iconMap = { success: 'check-circle', danger: 'exclamation-triangle', warning: 'exclamation-circle' };
  const icon = iconMap[type] || 'info-circle';
  const div = document.createElement('div');
  div.className = `toast align-items-center text-bg-${type} border-0`;
  div.setAttribute('role', 'alert');
  div.id = id;
  div.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="fa fa-${icon}"></i> ${escHtml(msg)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  toastContainer.appendChild(div);
  const bsToast = new bootstrap.Toast(div, { delay: 3500 });
  bsToast.show();
  div.addEventListener('hidden.bs.toast', () => div.remove());
}

// ── Helpers ────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────────────────
loadTutorials();
