/* ═══════════════════════════════════════════════════════
   BHAWANTHA LAKSHAN — ADMIN PANEL JAVASCRIPT
   Portfolio CRUD + Supabase Auth + Cloud Database
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let editingId = null;
let deleteId  = null;
let allItems  = [];

/* ══════════════════════════════════════════
   CATEGORY CONFIG
   ══════════════════════════════════════════ */
const CATEGORY_LABELS = {
  design: 'Graphic Design',
  web:    'Web Dev',
  social: 'Social Media',
  video:  'Video Editing',
};

/* ══════════════════════════════════════════
   AUTH — Supabase Auth (email + password)
   ══════════════════════════════════════════ */
async function getSession() {
  const { data } = await db.auth.getSession();
  return data?.session ?? null;
}

async function login(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function logout() {
  await db.auth.signOut();
  location.reload();
}

/* ══════════════════════════════════════════
   DATABASE — Fetch portfolio items
   ══════════════════════════════════════════ */
async function fetchItems() {
  /* Admin fetches ALL items (including unpublished) */
  const { data, error } = await db
    .from('portfolio_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    showToast('Failed to load items: ' + error.message, 'error');
    return [];
  }
  return data || [];
}

/* ══════════════════════════════════════════
   STATS
   ══════════════════════════════════════════ */
function updateStats(items) {
  document.getElementById('stat-total').textContent  = items.length;
  document.getElementById('stat-design').textContent = items.filter(i => i.category === 'design').length;
  document.getElementById('stat-web').textContent    = items.filter(i => i.category === 'web').length;
  document.getElementById('stat-social').textContent = items.filter(i => i.category === 'social' || i.category === 'video').length;
}

/* ══════════════════════════════════════════
   RENDER ITEMS
   ══════════════════════════════════════════ */
function getCategoryBadge(cat) {
  const map = { design:'badge-design', web:'badge-web', social:'badge-social', video:'badge-video' };
  return `<span class="badge ${map[cat] || 'badge-default'}">${CATEGORY_LABELS[cat] || cat}</span>`;
}

function renderItems() {
  updateStats(allItems);
  const list = document.getElementById('items-list');

  if (allItems.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <p>No portfolio items yet. Click "Add New Work" to get started.</p>
      </div>`;
    return;
  }

  list.innerHTML = allItems.map(item => {
    const thumbHtml = item.image_url
      ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="item-thumb"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="item-thumb-placeholder" style="display:none;"><i class="fa-solid fa-image"></i></div>`
      : `<div class="item-thumb-placeholder"><i class="fa-solid fa-image"></i></div>`;

    const publishedBadge = item.published
      ? '<span class="badge" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);">Published</span>'
      : '<span class="badge badge-default">Draft</span>';

    return `
      <div class="portfolio-item-row" data-id="${item.id}">
        ${thumbHtml}
        <div class="item-info">
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-desc">${escapeHtml(item.description || '')}</div>
          <div class="item-meta">
            ${getCategoryBadge(item.category)}
            ${publishedBadge}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-edit btn-sm" onclick="openEditModal('${item.id}')">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   LOAD & REFRESH
   ══════════════════════════════════════════ */
async function loadAndRender() {
  const list = document.getElementById('items-list');
  list.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-spinner fa-spin" style="opacity:0.5;"></i>
      <p>Loading from cloud database…</p>
    </div>`;

  allItems = await fetchItems();
  renderItems();
}

/* ══════════════════════════════════════════
   MODAL — OPEN / CLOSE
   ══════════════════════════════════════════ */
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Work';
  document.getElementById('item-form').reset();
  document.getElementById('item-published').checked = true;
  clearImagePreview();
  openModal();
}

function openEditModal(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  editingId = id;

  document.getElementById('modal-title').textContent           = 'Edit Portfolio Item';
  document.getElementById('item-title').value                  = item.title       || '';
  document.getElementById('item-category').value               = item.category    || 'design';
  document.getElementById('item-description').value            = item.description || '';
  document.getElementById('item-image-url').value              = item.image_url   || '';
  document.getElementById('item-link').value                   = item.link        || '';
  document.getElementById('item-sort-order').value             = item.sort_order  ?? 0;
  document.getElementById('item-published').checked            = item.published   ?? true;

  if (item.image_url) {
    setImagePreview(item.image_url);
  } else {
    clearImagePreview();
  }
  openModal();
}

function openModal() {
  document.getElementById('item-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('item-modal').classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
}

/* ══════════════════════════════════════════
   IMAGE PREVIEW
   ══════════════════════════════════════════ */
function setImagePreview(src) {
  const wrap = document.getElementById('image-preview-wrap');
  const img  = document.getElementById('preview-img');
  img.src = src;
  wrap.classList.add('has-image');
  img.style.display = 'block';
  wrap.querySelector('.image-preview-placeholder').style.display = 'none';
}

function clearImagePreview() {
  const wrap = document.getElementById('image-preview-wrap');
  const img  = document.getElementById('preview-img');
  img.src = '';
  img.style.display = 'none';
  wrap.classList.remove('has-image');
  wrap.querySelector('.image-preview-placeholder').style.display = 'flex';
}

/* ══════════════════════════════════════════
   FILE UPLOAD HANDLER (base64 for image_url)
   ══════════════════════════════════════════ */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.', 'error');
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    showToast('Image must be under 3MB for base64 storage.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(ev) {
    const base64 = ev.target.result;
    document.getElementById('item-image-url').value = base64;
    setImagePreview(base64);
    showToast('Image loaded! Save to store in database.', 'success');
  };
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════════
   FORM SUBMISSION — INSERT / UPDATE
   ══════════════════════════════════════════ */
async function saveItem(e) {
  e.preventDefault();

  const title       = document.getElementById('item-title').value.trim();
  const category    = document.getElementById('item-category').value;
  const description = document.getElementById('item-description').value.trim();
  const image_url   = document.getElementById('item-image-url').value.trim();
  const link        = document.getElementById('item-link').value.trim();
  const sort_order  = parseInt(document.getElementById('item-sort-order').value, 10) || 0;
  const published   = document.getElementById('item-published').checked;

  if (!title || !category) {
    showToast('Title and category are required.', 'error');
    return;
  }

  /* Set save button to loading */
  const saveBtn = document.getElementById('modal-save-btn');
  const origHTML = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
  saveBtn.disabled = true;

  try {
    if (editingId) {
      /* UPDATE */
      const { error } = await db
        .from('portfolio_items')
        .update({ title, category, description, image_url, link, sort_order, published })
        .eq('id', editingId);

      if (error) throw error;
      showToast('Portfolio item updated!', 'success');

    } else {
      /* INSERT */
      const { error } = await db
        .from('portfolio_items')
        .insert([{ title, category, description, image_url, link, sort_order, published }]);

      if (error) throw error;
      showToast('New item added to cloud database!', 'success');
    }

    closeModal();
    await loadAndRender();

  } catch (err) {
    showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    saveBtn.innerHTML = origHTML;
    saveBtn.disabled = false;
  }
}

/* ══════════════════════════════════════════
   DELETE
   ══════════════════════════════════════════ */
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  deleteId = null;
  document.getElementById('confirm-overlay').classList.remove('open');
}

async function executeDelete() {
  if (!deleteId) return;

  const delBtn = document.getElementById('confirm-delete-btn');
  const origHTML = delBtn.innerHTML;
  delBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  delBtn.disabled = true;

  try {
    const { error } = await db
      .from('portfolio_items')
      .delete()
      .eq('id', deleteId);

    if (error) throw error;

    closeConfirm();
    await loadAndRender();
    showToast('Item deleted from cloud.', 'warn');

  } catch (err) {
    showToast('Delete failed: ' + (err.message || 'Unknown error'), 'error');
    delBtn.innerHTML = origHTML;
    delBtn.disabled = false;
  } finally {
    deleteId = null;
  }
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════ */
function showToast(message, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warn: 'fa-triangle-exclamation' };
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 3800);
}

/* ══════════════════════════════════════════
   ESCAPE HTML
   ══════════════════════════════════════════ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════
   INIT — DOMContentLoaded
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  /* ── Check existing Supabase session ── */
  let session = await getSession();
  if (session) {
    document.getElementById('login-screen').classList.add('hidden');
    await loadAndRender();
    showToast('Welcome back, Bhawantha! 👋', 'success');
  }

  /* ── Login form — Supabase email + password ── */
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const err       = document.getElementById('login-error');

    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Signing in…</span>';
    submitBtn.disabled = true;
    err.classList.remove('show');

    try {
      await login(email, password);
      document.getElementById('login-screen').classList.add('hidden');
      await loadAndRender();
      showToast('Welcome back, Bhawantha! 👋', 'success');
    } catch (error) {
      err.querySelector('span').textContent = 'Incorrect email or password. Please try again.';
      err.classList.add('show');
      setTimeout(() => err.classList.remove('show'), 4000);
      document.getElementById('login-password').value = '';
    } finally {
      submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>Login</span>';
      submitBtn.disabled = false;
    }
  });

  /* ── Logout ── */
  document.getElementById('logout-btn').addEventListener('click', logout);

  /* ── Add new item ── */
  document.getElementById('add-item-btn').addEventListener('click', openAddModal);

  /* ── Modal close ── */
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('item-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('item-modal')) closeModal();
  });

  /* ── Form save ── */
  document.getElementById('item-form').addEventListener('submit', saveItem);

  /* ── File upload ── */
  document.getElementById('file-input').addEventListener('change', handleFileUpload);

  /* ── Image URL preview on input ── */
  document.getElementById('item-image-url').addEventListener('input', function() {
    const val = this.value.trim();
    if (val) setImagePreview(val);
    else clearImagePreview();
  });

  /* ── Confirm delete ── */
  document.getElementById('confirm-delete-btn').addEventListener('click', executeDelete);
  document.getElementById('confirm-cancel-btn').addEventListener('click', closeConfirm);
  document.getElementById('confirm-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('confirm-overlay')) closeConfirm();
  });

  /* ── ESC to close ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeConfirm(); }
  });

  /* ── Listen for Supabase auth state changes ── */
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      document.getElementById('login-screen').classList.remove('hidden');
    }
  });
});
