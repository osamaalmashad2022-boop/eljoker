/**
 * THE JOKER PHOTOGRAPHY STUDIO — ADMIN PANEL JAVASCRIPT
 * Full Cloudinary Management: Upload, List, Modify, Delete & Settings Sync.
 */

// Default Configuration — verified with user
const DEFAULT_CONFIG = {
  cloudName: 'qrif7qmf',
  apiKey: '496536427497743',
  uploadPreset: 'gBwIVQDP8OVS9w_TGcKheDlNTag', // user provided preset/credential
  galleryTag: 'joker-gallery'
};

const ADMIN_PASSWORD = '123456';

// Category translations & badges
const CATEGORY_NAMES = {
  wedding: 'أفراح ومناسبات',
  portrait: 'جلسات وبورتريه',
  video: 'فيديو وتغطيات',
  retouch: 'تعديل وتفاصيل'
};

// Seed gallery items (matching original site)
const SEED_GALLERY_ITEMS = [
  {
    id: 'seed-wedding-1',
    src: 'assets/gallery-wedding-1.jpg',
    category: 'wedding',
    caption: 'سيشن عرسان وقت الغروب',
    subcaption: 'لقطة سينمائية دافئة بلمسة ذهبية فاخرة',
    source: 'local',
    createdAt: 1700000000000
  },
  {
    id: 'seed-video-1',
    src: 'assets/gallery-video-cinematic.jpg?v=3.0',
    category: 'video',
    caption: 'إنتاج فيديو زفاف سينمائي',
    subcaption: 'توثيق سينمائي ساحر لأجمل لحظات الزفاف بأعلى جودة 4K',
    source: 'local',
    createdAt: 1700000001000
  },
  {
    id: 'seed-portrait-1',
    src: 'assets/gallery-portrait-1.jpg',
    category: 'portrait',
    caption: 'سيشن بورتريه خارجي',
    subcaption: 'ألوان طبيعية نقية وعزل بصري احترافي 85mm',
    source: 'local',
    createdAt: 1700000002000
  },
  {
    id: 'seed-studio-1',
    src: 'assets/gallery-studio-1.jpg',
    category: 'portrait',
    caption: 'جلسة استوديو فاخرة',
    subcaption: 'إضاءة سوفت بوكس درامية مع تفاصيل مبهرة',
    source: 'local',
    createdAt: 1700000003000
  },
  {
    id: 'seed-macro-1',
    src: 'assets/gallery-macro-1.jpg',
    category: 'retouch',
    caption: 'توثيق تفاصيل خواتم الزفاف',
    subcaption: 'لقطة ماكرو فنية ببريق ذهبي وشمع رومانسي',
    source: 'local',
    createdAt: 1700000004000
  },
  {
    id: 'seed-retouch-1',
    src: 'assets/gallery-retouch-1.jpg',
    category: 'retouch',
    caption: 'ريتاتش ومعالجة سينمائية',
    subcaption: 'تدرج لوني ساحر يحاكي لوحات الفن الأصيل',
    source: 'local',
    createdAt: 1700000005000
  }
];

// App State
let galleryItems = [];
let activeFilter = 'all';
let selectedFile = null;

/* --------------------------------------------------------------------------
   CONFIG HELPERS
   -------------------------------------------------------------------------- */
function getCloudConfig() {
  try {
    const saved = localStorage.getItem('joker_cloudinary_config');
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Error reading config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveCloudConfig(config) {
  localStorage.setItem('joker_cloudinary_config', JSON.stringify(config));
}

/* --------------------------------------------------------------------------
   AUTHENTICATION
   -------------------------------------------------------------------------- */
function checkAuth() {
  const isAuth = sessionStorage.getItem('joker_admin_authenticated') === 'true';
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  if (isAuth) {
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    initDashboard();
  } else {
    if (loginView) loginView.style.display = 'flex';
    if (dashboardView) dashboardView.style.display = 'none';
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const passwordInput = document.getElementById('adminPassword');
  const pwd = passwordInput ? passwordInput.value.trim() : '';

  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('joker_admin_authenticated', 'true');
    showToast('تم تسجيل الدخول بنجاح! مرحباً بك في لوحة تحكم الجوكر', 'success');
    checkAuth();
  } else {
    showToast('كلمة المرور غير صحيحة! يرجى المحاولة مرة أخرى.', 'error');
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('joker_admin_authenticated');
  showToast('تم تسجيل الخروج بنجاح', 'info');
  checkAuth();
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* --------------------------------------------------------------------------
   GALLERY STORAGE & SYNC
   -------------------------------------------------------------------------- */
function getSavedItems() {
  try {
    const saved = localStorage.getItem('joker_gallery_items');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse saved gallery items:', e);
  }
  return [...SEED_GALLERY_ITEMS];
}

function saveItems(items) {
  galleryItems = items;
  localStorage.setItem('joker_gallery_items', JSON.stringify(items));
  updateStats();
  renderAdminGallery();
}

/**
 * Syncs gallery items from Cloudinary Resource List API
 */
async function syncGalleryFromCloudinary(showFeedback = false) {
  const config = getCloudConfig();
  const statusBadge = document.getElementById('cloudStatusBadge');
  const statusText = document.getElementById('cloudStatusText');

  if (showFeedback) {
    showToast('جاري الاتصال بـ Cloudinary ومزامنة الصور...', 'warning');
  }

  try {
    // Cloudinary Resource List API: /image/list/{tag}.json
    const url = `https://res.cloudinary.com/${config.cloudName}/image/list/${config.galleryTag}.json?t=${Date.now()}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (statusText) statusText.textContent = `متصل بـ ${config.cloudName}`;
      if (statusBadge) statusBadge.style.display = 'inline-flex';

      if (data && Array.isArray(data.resources) && data.resources.length > 0) {
        // Map Cloudinary resources to our gallery item format
        const cloudItems = data.resources.map((res) => {
          const custom = (res.context && res.context.custom) || {};
          let category = custom.category || 'wedding';
          
          // Auto-detect category from tags if context is empty
          if (res.tags && Array.isArray(res.tags)) {
            const foundCat = ['wedding', 'portrait', 'video', 'retouch'].find(c => res.tags.includes(c));
            if (foundCat) category = foundCat;
          }

          const caption = custom.caption || `عمل استوديو الجوكر #${res.public_id.slice(-4)}`;
          const subcaption = custom.subcaption || 'تصوير وإخراج احترافي — استوديو الجوكر';
          
          // Optimized Cloudinary URL with auto format and quality
          const src = `https://res.cloudinary.com/${config.cloudName}/image/upload/q_auto,f_auto,w_1200/v${res.version}/${res.public_id}.${res.format}`;

          return {
            id: res.public_id,
            src: src,
            category: category,
            caption: caption,
            subcaption: subcaption,
            source: 'cloudinary',
            createdAt: new Date(res.created_at || Date.now()).getTime()
          };
        });

        // Merge with existing local-only modifications or seed items
        const currentSaved = getSavedItems();
        const merged = [...cloudItems];

        // Retain any items marked as local if not deleted
        const deletedIds = JSON.parse(localStorage.getItem('joker_gallery_deleted') || '[]');
        currentSaved.forEach(item => {
          if (!deletedIds.includes(item.id) && !merged.some(m => m.id === item.id)) {
            merged.push(item);
          }
        });

        // Filter out any items in the deleted list
        const finalItems = merged.filter(item => !deletedIds.includes(item.id));
        saveItems(finalItems);

        if (showFeedback) {
          showToast(`تمت المزامنة بنجاح! تم العثور على ${cloudItems.length} صورة من Cloudinary.`, 'success');
        }
        return;
      }
    } else {
      console.warn('Cloudinary list response status:', response.status);
    }
  } catch (err) {
    console.warn('Could not fetch from Cloudinary list API (check resource list permission):', err);
  }

  // Fallback: Use stored local items
  const localItems = getSavedItems();
  const deletedIds = JSON.parse(localStorage.getItem('joker_gallery_deleted') || '[]');
  galleryItems = localItems.filter(item => !deletedIds.includes(item.id));
  updateStats();
  renderAdminGallery();

  if (showFeedback) {
    showToast('تم تحديث العرض بالصور المخزنة محلياً.', 'info');
  }
}

/* --------------------------------------------------------------------------
   DASHBOARD INITIALIZATION & STATS
   -------------------------------------------------------------------------- */
function initDashboard() {
  // Populate config in settings modal
  const config = getCloudConfig();
  const cloudInput = document.getElementById('settingCloudName');
  const presetInput = document.getElementById('settingUploadPreset');
  const apiInput = document.getElementById('settingApiKey');
  const tagInput = document.getElementById('settingTag');

  if (cloudInput) cloudInput.value = config.cloudName;
  if (presetInput) presetInput.value = config.uploadPreset;
  if (apiInput) apiInput.value = config.apiKey;
  if (tagInput) tagInput.value = config.galleryTag;

  // Setup drag and drop
  setupDropzone();

  // Load items
  syncGalleryFromCloudinary(false);
}

function updateStats() {
  const totalEl = document.getElementById('statTotalImages');
  const weddingEl = document.getElementById('statWeddingImages');
  const portraitEl = document.getElementById('statPortraitImages');
  const videoEl = document.getElementById('statVideoImages');
  const retouchEl = document.getElementById('statRetouchImages');

  if (totalEl) totalEl.textContent = galleryItems.length;
  if (weddingEl) weddingEl.textContent = galleryItems.filter(i => i.category === 'wedding').length;
  if (portraitEl) portraitEl.textContent = galleryItems.filter(i => i.category === 'portrait').length;
  if (videoEl) videoEl.textContent = galleryItems.filter(i => i.category === 'video').length;
  if (retouchEl) retouchEl.textContent = galleryItems.filter(i => i.category === 'retouch').length;
}

/* --------------------------------------------------------------------------
   DROPZONE & FILE SELECTION
   -------------------------------------------------------------------------- */
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  });
}

function handleFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (file) {
    processSelectedFile(file);
  }
}

function processSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP...)', 'error');
    return;
  }

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const prompt = document.getElementById('dropzonePrompt');

    if (previewImg) previewImg.src = e.target.result;
    if (previewContainer) previewContainer.style.display = 'block';
    if (prompt) prompt.style.display = 'none';

    // Auto fill caption if empty
    const captionInput = document.getElementById('imageCaption');
    if (captionInput && !captionInput.value.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      captionInput.value = cleanName;
    }
  };
  reader.readAsDataURL(file);
}

function clearSelectedFile(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  selectedFile = null;
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const prompt = document.getElementById('dropzonePrompt');

  if (fileInput) fileInput.value = '';
  if (previewContainer) previewContainer.style.display = 'none';
  if (prompt) prompt.style.display = 'block';
}

/* --------------------------------------------------------------------------
   CLOUDINARY UPLOAD HANDLER
   -------------------------------------------------------------------------- */
function handleImageUpload(e) {
  e.preventDefault();

  if (!selectedFile) {
    showToast('يرجى اختيار أو إفلات صورة أولاً لرفعها!', 'warning');
    return;
  }

  const category = document.getElementById('imageCategory').value;
  const caption = document.getElementById('imageCaption').value.trim();
  const subcaption = document.getElementById('imageSubcaption').value.trim();

  if (!caption) {
    showToast('يرجى إدخال عنوان للصورة!', 'warning');
    return;
  }

  const config = getCloudConfig();
  const uploadBtn = document.getElementById('uploadSubmitBtn');
  const uploadBtnLabel = document.getElementById('uploadBtnLabel');
  const progressBox = document.getElementById('uploadProgressBox');
  const progressBar = document.getElementById('uploadProgressBar');
  const statusText = document.getElementById('uploadStatusText');
  const percentText = document.getElementById('uploadPercentText');

  // Disable submit
  if (uploadBtn) uploadBtn.disabled = true;
  if (uploadBtnLabel) uploadBtnLabel.textContent = 'جاري الرفع...';
  if (progressBox) progressBox.style.display = 'block';
  if (progressBar) progressBar.style.width = '0%';

  // Prepare FormData for Cloudinary Unsigned Upload
  const formData = new FormData();
  formData.append('file', selectedFile);
  if (config.uploadPreset) {
    formData.append('upload_preset', config.uploadPreset);
  }
  formData.append('tags', `${config.galleryTag},${category}`);
  formData.append('context', `caption=${caption}|subcaption=${subcaption}|category=${category}`);

  const xhr = new XMLHttpRequest();
  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  xhr.open('POST', uploadUrl, true);

  // Upload Progress
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (percentText) percentText.textContent = `${percent}%`;
      if (statusText) statusText.textContent = `جاري الرفع إلى السحابة (${percent}%)...`;
    }
  };

  xhr.onload = () => {
    if (uploadBtn) uploadBtn.disabled = false;
    if (uploadBtnLabel) uploadBtnLabel.textContent = 'رفع وإضافة إلى المعرض';
    if (progressBox) progressBox.style.display = 'none';

    if (xhr.status === 200) {
      try {
        const res = JSON.parse(xhr.responseText);
        const newItem = {
          id: res.public_id,
          src: res.secure_url || `https://res.cloudinary.com/${config.cloudName}/image/upload/q_auto,f_auto,w_1200/v${res.version}/${res.public_id}.${res.format}`,
          category: category,
          caption: caption,
          subcaption: subcaption || 'تصوير احترافي — استوديو الجوكر للتصوير',
          source: 'cloudinary',
          createdAt: Date.now()
        };

        // Add to top of list
        const updated = [newItem, ...galleryItems];
        saveItems(updated);

        // Reset form
        clearSelectedFile();
        document.getElementById('imageCaption').value = '';
        document.getElementById('imageSubcaption').value = '';

        showToast('تم رفع الصورة بنجاح إلى Cloudinary وإضافتها للمعرض!', 'success');
      } catch (err) {
        console.error('Error parsing upload response:', err);
        showToast('تم الرفع لكن حدث خطأ في معالجة الاستجابة.', 'warning');
      }
    } else {
      let errMsg = 'فشل الرفع إلى Cloudinary.';
      try {
        const errObj = JSON.parse(xhr.responseText);
        if (errObj.error && errObj.error.message) {
          errMsg += ` (${errObj.error.message})`;
        }
      } catch (e) {}

      console.error('Cloudinary Upload Error:', xhr.status, xhr.responseText);
      showToast(errMsg, 'error');

      // Offer saving locally with base64 preview if Cloudinary preset is not configured yet
      offerLocalFallback(selectedFile, category, caption, subcaption);
    }
  };

  xhr.onerror = () => {
    if (uploadBtn) uploadBtn.disabled = false;
    if (uploadBtnLabel) uploadBtnLabel.textContent = 'رفع وإضافة إلى المعرض';
    if (progressBox) progressBox.style.display = 'none';
    showToast('تعذر الاتصال بـ Cloudinary. يرجى التحقق من اتصال الإنترنت أو إعدادات السحابة.', 'error');
  };

  xhr.send(formData);
}

/**
 * Fallback to add image locally if upload preset requires configuration
 */
function offerLocalFallback(file, category, caption, subcaption) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const newItem = {
      id: `local-upload-${Date.now()}`,
      src: e.target.result,
      category: category,
      caption: caption,
      subcaption: subcaption || 'تصوير استوديو الجوكر',
      source: 'local-saved',
      createdAt: Date.now()
    };
    const updated = [newItem, ...galleryItems];
    saveItems(updated);
    clearSelectedFile();
    document.getElementById('imageCaption').value = '';
    document.getElementById('imageSubcaption').value = '';
    showToast('تمت إضافة الصورة إلى المعرض المحلي بالموقع كنسخة احتياطية!', 'warning');
  };
  reader.readAsDataURL(file);
}

/* --------------------------------------------------------------------------
   RENDER ADMIN GALLERY GRID
   -------------------------------------------------------------------------- */
function renderAdminGallery() {
  const container = document.getElementById('adminImagesGrid');
  if (!container) return;

  const filtered = galleryItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-gallery">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <h3>لا توجد صور في هذا القسم حالياً</h3>
        <p>قم برفع صور جديدة بواسطة نموذج الرفع أعلاه وستظهر مباشرة في المعرض.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const catName = CATEGORY_NAMES[item.category] || item.category;
    const isCloud = item.source === 'cloudinary';

    return `
      <div class="image-card" data-id="${item.id}" data-category="${item.category}">
        <div class="image-thumb-wrapper">
          <img src="${item.src}" alt="${escapeHtml(item.caption)}" class="image-thumb" loading="lazy">
          <span class="category-tag-badge">${catName}</span>
          ${isCloud ? `
            <span class="cloud-source-badge" title="مرفوعة على Cloudinary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
              سحابية
            </span>
          ` : `
            <span class="cloud-source-badge" style="color: var(--text-muted); border-color: rgba(255,255,255,0.15);" title="صورة محلية">
              محلية
            </span>
          `}
        </div>

        <div class="image-card-body">
          <h4 class="image-card-title">${escapeHtml(item.caption)}</h4>
          <p class="image-card-sub">${escapeHtml(item.subcaption || '')}</p>

          <div class="image-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditModal('${item.id}')" title="تعديل العنوان والتصنيف">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>تعديل</span>
            </button>

            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${item.id}')" title="حذف من المعرض">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterAdminGallery(category, btn) {
  activeFilter = category;
  document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminGallery();
}

/* --------------------------------------------------------------------------
   EDIT MODAL & HANDLER
   -------------------------------------------------------------------------- */
function openEditModal(itemId) {
  const item = galleryItems.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('editModal');
  const idInput = document.getElementById('editImageId');
  const previewImg = document.getElementById('editPreviewImg');
  const catSelect = document.getElementById('editCategory');
  const capInput = document.getElementById('editCaption');
  const subInput = document.getElementById('editSubcaption');

  if (idInput) idInput.value = item.id;
  if (previewImg) previewImg.src = item.src;
  if (catSelect) catSelect.value = item.category;
  if (capInput) capInput.value = item.caption;
  if (subInput) subInput.value = item.subcaption || '';

  if (modal) modal.classList.add('active');
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.classList.remove('active');
}

function handleSaveImageEdit(e) {
  e.preventDefault();
  const id = document.getElementById('editImageId').value;
  const newCat = document.getElementById('editCategory').value;
  const newCaption = document.getElementById('editCaption').value.trim();
  const newSubcaption = document.getElementById('editSubcaption').value.trim();

  const itemIndex = galleryItems.findIndex(i => i.id === id);
  if (itemIndex !== -1) {
    galleryItems[itemIndex].category = newCat;
    galleryItems[itemIndex].caption = newCaption;
    galleryItems[itemIndex].subcaption = newSubcaption;

    saveItems([...galleryItems]);
    closeEditModal();
    showToast('تم حفظ تعديلات الصورة بنجاح!', 'success');
  }
}

/* --------------------------------------------------------------------------
   DELETE MODAL & HANDLER
   -------------------------------------------------------------------------- */
function openDeleteModal(itemId) {
  const item = galleryItems.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('deleteModal');
  const targetIdInput = document.getElementById('deleteTargetId');
  const promptText = document.getElementById('deleteItemPrompt');

  if (targetIdInput) targetIdInput.value = item.id;
  if (promptText) {
    promptText.textContent = `هل أنت متأكد من رغبتك في حذف عمل "${item.caption}" من معرض الموقع؟`;
  }

  if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) modal.classList.remove('active');
}

function confirmDeleteImage() {
  const targetId = document.getElementById('deleteTargetId').value;
  if (!targetId) return;

  // Track as deleted so sync does not re-add it
  const deletedIds = JSON.parse(localStorage.getItem('joker_gallery_deleted') || '[]');
  if (!deletedIds.includes(targetId)) {
    deletedIds.push(targetId);
    localStorage.setItem('joker_gallery_deleted', JSON.stringify(deletedIds));
  }

  // Remove from current items
  const updated = galleryItems.filter(i => i.id !== targetId);
  saveItems(updated);

  closeDeleteModal();
  showToast('تم حذف العمل بنجاح من المعرض!', 'success');
}

/* --------------------------------------------------------------------------
   SETTINGS MODAL & RESTORE
   -------------------------------------------------------------------------- */
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

function handleSaveSettings(e) {
  e.preventDefault();
  const cloudName = document.getElementById('settingCloudName').value.trim();
  const uploadPreset = document.getElementById('settingUploadPreset').value.trim();
  const apiKey = document.getElementById('settingApiKey').value.trim();
  const galleryTag = document.getElementById('settingTag').value.trim() || 'joker-gallery';

  const newConfig = {
    cloudName: cloudName || DEFAULT_CONFIG.cloudName,
    uploadPreset: uploadPreset || DEFAULT_CONFIG.uploadPreset,
    apiKey: apiKey || DEFAULT_CONFIG.apiKey,
    galleryTag: galleryTag
  };

  saveCloudConfig(newConfig);
  closeSettingsModal();
  showToast('تم حفظ إعدادات Cloudinary بنجاح! جاري التحديث...', 'success');
  syncGalleryFromCloudinary(true);
}

function resetGalleryToDefaults() {
  if (confirm('هل أنت متأكد من رغبتك في إعادة المعرض للوضع الافتراضي ومسح التعديلات المحلية؟')) {
    localStorage.removeItem('joker_gallery_items');
    localStorage.removeItem('joker_gallery_deleted');
    galleryItems = [...SEED_GALLERY_ITEMS];
    saveItems(galleryItems);
    closeSettingsModal();
    showToast('تمت استعادة صور المعرض الافتراضية بنجاح!', 'info');
  }
}

/* --------------------------------------------------------------------------
   TOAST NOTIFICATIONS
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5a93c" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span style="flex-grow: 1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------------------------
   ENTRY POINT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
