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

  // Initialize Watermark Tool
  initWatermarkTool();

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

/* ==========================================================================
   WATERMARK & COPYRIGHT TOOL ENGINE
   ========================================================================== */
const wmState = {
  mode: 'single',             // 'single' | 'batch'
  type: 'text',               // 'text' | 'logo' | 'customLogo'
  text: '© استوديو الجوكر للتصوير',
  textColor: '#fbe089',
  textStyle: 'shadow',        // 'shadow' | 'stroke' | 'pill' | 'plain'
  position: 'bottom-right',   // 9 positions
  marginPercent: 5,
  opacity: 0.70,
  scale: 1.0,
  rotationDeg: 0,
  tiledPattern: false,
  sourceImage: null,
  sourceFilename: 'joker_image.jpg',
  defaultLogoImage: null,
  customLogoImage: null,
  batchFiles: [],
  renderTimer: null
};

/**
 * Initialize Watermark Tool and preload logo
 */
function initWatermarkTool() {
  // Preload default studio logo
  if (!wmState.defaultLogoImage) {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = 'assets/joker-logo.jpg';
    logoImg.onload = () => {
      wmState.defaultLogoImage = logoImg;
      if (wmState.sourceImage && wmState.type === 'logo') {
        triggerWatermarkRender();
      }
    };
  }

  // Setup drag and drop for watermark canvas box
  const canvasBox = document.getElementById('watermarkCanvasBox');
  if (canvasBox) {
    ['dragenter', 'dragover'].forEach(eventName => {
      canvasBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvasBox.style.borderColor = 'var(--gold-primary)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      canvasBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvasBox.style.borderColor = '';
      }, false);
    });

    canvasBox.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt && dt.files;
      if (files && files.length > 0) {
        if (wmState.mode === 'batch' || files.length > 1) {
          switchWatermarkMode('batch');
          handleWmBatchFilesList(Array.from(files));
        } else {
          loadWmImageFromFile(files[0]);
        }
      }
    });
  }
}

/**
 * Switch between Single mode and Batch mode
 */
function switchWatermarkMode(mode) {
  wmState.mode = mode;
  const singleBtn = document.getElementById('modeSingleBtn');
  const batchBtn = document.getElementById('modeBatchBtn');
  const batchQueueBox = document.getElementById('batchQueueBox');
  const fileSelectBtnText = document.getElementById('wmFileSelectBtnText');

  if (mode === 'batch') {
    if (singleBtn) singleBtn.classList.remove('active');
    if (batchBtn) batchBtn.classList.add('active');
    if (batchQueueBox) batchQueueBox.style.display = 'block';
    if (fileSelectBtnText) fileSelectBtnText.textContent = 'اختيار مجموعة صور من الجهاز';
    showToast('تم التبديل إلى وضع المعالجة الجماعية (Batch Mode)', 'info');
  } else {
    if (singleBtn) singleBtn.classList.add('active');
    if (batchBtn) batchBtn.classList.remove('active');
    if (batchQueueBox) batchQueueBox.style.display = 'none';
    if (fileSelectBtnText) fileSelectBtnText.textContent = 'رفع صورة من الجهاز';
  }
}

/**
 * Trigger file dialog depending on active mode
 */
function triggerWmFileInput() {
  if (wmState.mode === 'batch') {
    const input = document.getElementById('wmBatchFileInput');
    if (input) input.click();
  } else {
    const input = document.getElementById('wmFileInput');
    if (input) input.click();
  }
}

function handleWmFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (file) {
    loadWmImageFromFile(file);
  }
}

function loadWmImageFromFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('يرجى اختيار ملف صورة صالح!', 'error');
    return;
  }

  wmState.sourceFilename = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      wmState.sourceImage = img;
      onSourceImageLoaded();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function onSourceImageLoaded() {
  const canvas = document.getElementById('watermarkCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');
  const canvasBox = document.getElementById('watermarkCanvasBox');
  const statusBar = document.getElementById('canvasStatusBar');
  const resPill = document.getElementById('wmOriginalRes');
  const downloadBtn = document.getElementById('downloadWmBtn');
  const sendToUploadBtn = document.getElementById('sendToUploadBtn');

  if (canvas) canvas.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  if (canvasBox) canvasBox.classList.add('has-image');
  if (statusBar) statusBar.style.display = 'flex';
  if (resPill) {
    const w = wmState.sourceImage.naturalWidth || wmState.sourceImage.width;
    const h = wmState.sourceImage.naturalHeight || wmState.sourceImage.height;
    resPill.textContent = `${w} × ${h} px`;
  }
  if (downloadBtn) downloadBtn.disabled = false;
  if (sendToUploadBtn) sendToUploadBtn.disabled = false;

  triggerWatermarkRender();
  showToast('تم تحميل الصورة للمحرر بنجاح! يمكنك ضبط العلامة المائية الآن.', 'success');
}

/**
 * Switch Watermark Type (text, logo, customLogo)
 */
function setWatermarkType(type) {
  wmState.type = type;

  const textBtn = document.getElementById('wmTypeTextBtn');
  const logoBtn = document.getElementById('wmTypeLogoBtn');
  const customBtn = document.getElementById('wmTypeCustomLogoBtn');

  const textControls = document.getElementById('wmTextControls');
  const logoControls = document.getElementById('wmLogoControls');
  const customControls = document.getElementById('wmCustomLogoControls');

  [textBtn, logoBtn, customBtn].forEach(b => b && b.classList.remove('active'));

  if (type === 'text') {
    if (textBtn) textBtn.classList.add('active');
    if (textControls) textControls.style.display = 'block';
    if (logoControls) logoControls.style.display = 'none';
    if (customControls) customControls.style.display = 'none';
  } else if (type === 'logo') {
    if (logoBtn) logoBtn.classList.add('active');
    if (textControls) textControls.style.display = 'none';
    if (logoControls) logoControls.style.display = 'block';
    if (customControls) customControls.style.display = 'none';
  } else if (type === 'customLogo') {
    if (customBtn) customBtn.classList.add('active');
    if (textControls) textControls.style.display = 'none';
    if (logoControls) logoControls.style.display = 'none';
    if (customControls) customControls.style.display = 'block';
  }

  triggerWatermarkRender();
}

/**
 * Quick Preset Text Button Handler
 */
function setWmPresetText(preset) {
  const input = document.getElementById('wmTextInput');
  if (input) input.value = preset;
  triggerWatermarkRender();
}

/**
 * Handle custom logo image selection
 */
function handleCustomLogoSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      wmState.customLogoImage = img;
      const thumbBox = document.getElementById('customLogoThumbBox');
      const thumbImg = document.getElementById('customLogoThumbImg');
      const logoName = document.getElementById('customLogoName');
      const btnText = document.getElementById('wmCustomLogoBtnText');

      if (thumbImg) thumbImg.src = evt.target.result;
      if (thumbBox) thumbBox.style.display = 'flex';
      if (logoName) logoName.textContent = file.name;
      if (btnText) btnText.textContent = 'تغيير الشعار الخاص';

      triggerWatermarkRender();
      showToast('تم تحميل الشعار الخاص بنجاح!', 'success');
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Set Position (3x3 Grid)
 */
function setWatermarkPosition(pos) {
  wmState.position = pos;
  document.querySelectorAll('#wmPosGrid .pos-btn').forEach(btn => {
    if (btn.getAttribute('data-pos') === pos) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  triggerWatermarkRender();
}

/**
 * Sliders handlers
 */
function updateMarginValue(val) {
  wmState.marginPercent = parseInt(val, 10);
  const badge = document.getElementById('wmMarginVal');
  if (badge) badge.textContent = `${val}%`;
  triggerWatermarkRender();
}

function updateOpacityValue(val) {
  wmState.opacity = parseInt(val, 10) / 100;
  const badge = document.getElementById('wmOpacityVal');
  if (badge) badge.textContent = `${val}%`;
  triggerWatermarkRender();
}

function updateScaleValue(val) {
  wmState.scale = parseInt(val, 10) / 100;
  const badge = document.getElementById('wmScaleVal');
  if (badge) badge.textContent = `${val}%`;
  triggerWatermarkRender();
}

function updateRotateValue(val) {
  wmState.rotationDeg = parseInt(val, 10);
  const badge = document.getElementById('wmRotateVal');
  if (badge) badge.textContent = `${val}°`;
  triggerWatermarkRender();
}

/**
 * Debounced render trigger
 */
function triggerWatermarkRender() {
  if (wmState.renderTimer) cancelAnimationFrame(wmState.renderTimer);
  wmState.renderTimer = requestAnimationFrame(() => {
    // Read live UI inputs
    const textInput = document.getElementById('wmTextInput');
    const colorSelect = document.getElementById('wmTextColor');
    const styleSelect = document.getElementById('wmTextStyle');
    const patternToggle = document.getElementById('wmPatternToggle');

    if (textInput) wmState.text = textInput.value;
    if (colorSelect) wmState.textColor = colorSelect.value;
    if (styleSelect) wmState.textStyle = styleSelect.value;
    if (patternToggle) wmState.tiledPattern = patternToggle.checked;

    const canvas = document.getElementById('watermarkCanvas');
    if (canvas && wmState.sourceImage) {
      drawWatermarkOnCanvas(canvas, wmState.sourceImage, wmState);
    }
  });
}

/**
 * Core Canvas Watermark Rendering Engine
 */
function drawWatermarkOnCanvas(canvas, img, state) {
  if (!img) return;
  const ctx = canvas.getContext('2d');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  canvas.width = w;
  canvas.height = h;

  // 1. Draw base photo
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // 2. Apply watermark with global opacity
  ctx.save();
  ctx.globalAlpha = state.opacity;

  if (state.tiledPattern) {
    drawTiledWatermark(ctx, w, h, state);
  } else {
    drawSingleWatermark(ctx, w, h, state);
  }

  ctx.restore();
}

/**
 * Single Watermark rendering at chosen position
 */
function drawSingleWatermark(ctx, w, h, state) {
  const margin = Math.round(Math.min(w, h) * (state.marginPercent / 100));

  if (state.type === 'text') {
    const text = state.text || '© استوديو الجوكر';
    // Font scaled proportionally to image width
    const fontSize = Math.max(18, Math.round(w * 0.036 * state.scale));
    ctx.font = `bold ${fontSize}px 'Alexandria', 'Tajawal', sans-serif`;
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    let x = 0;
    let y = 0;

    // RTL Grid calculation:
    // right is at (w - margin), left is at margin
    switch (state.position) {
      case 'top-right':
        x = w - margin - textWidth;
        y = margin + textHeight / 2;
        break;
      case 'top-center':
        x = (w - textWidth) / 2;
        y = margin + textHeight / 2;
        break;
      case 'top-left':
        x = margin;
        y = margin + textHeight / 2;
        break;
      case 'middle-right':
        x = w - margin - textWidth;
        y = h / 2;
        break;
      case 'center':
        x = (w - textWidth) / 2;
        y = h / 2;
        break;
      case 'middle-left':
        x = margin;
        y = h / 2;
        break;
      case 'bottom-right':
        x = w - margin - textWidth;
        y = h - margin - textHeight / 2;
        break;
      case 'bottom-center':
        x = (w - textWidth) / 2;
        y = h - margin - textHeight / 2;
        break;
      case 'bottom-left':
        x = margin;
        y = h - margin - textHeight / 2;
        break;
      default:
        x = w - margin - textWidth;
        y = h - margin - textHeight / 2;
    }

    ctx.save();
    // Rotation around text center
    const cx = x + textWidth / 2;
    const cy = y;
    ctx.translate(cx, cy);
    if (state.rotationDeg !== 0) {
      ctx.rotate((state.rotationDeg * Math.PI) / 180);
    }

    const drawX = -textWidth / 2;
    const drawY = 0;

    // Apply text style
    if (state.textStyle === 'pill') {
      const padX = fontSize * 0.6;
      const padY = fontSize * 0.35;
      const pillW = textWidth + padX * 2;
      const pillH = textHeight + padY * 2;
      const pillX = drawX - padX;
      const pillY = drawY - pillH / 2;
      const radius = Math.min(pillH / 2, 14);

      ctx.save();
      ctx.fillStyle = 'rgba(8, 10, 15, 0.85)';
      ctx.strokeStyle = state.textColor;
      ctx.lineWidth = Math.max(1, fontSize * 0.04);
      roundRect(ctx, pillX, pillY, pillW, pillH, radius, true, true);
      ctx.restore();
    } else if (state.textStyle === 'shadow') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = Math.max(4, fontSize * 0.25);
      ctx.shadowOffsetX = Math.max(2, fontSize * 0.07);
      ctx.shadowOffsetY = Math.max(2, fontSize * 0.07);
    } else if (state.textStyle === 'stroke') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = Math.max(3, fontSize * 0.1);
      ctx.strokeText(text, drawX, drawY);
    }

    ctx.fillStyle = state.textColor;
    ctx.fillText(text, drawX, drawY);
    ctx.restore();

  } else {
    // Logo Watermark (Studio or Custom)
    const logo = state.type === 'logo' ? wmState.defaultLogoImage : wmState.customLogoImage;
    if (!logo || !logo.complete) return;

    const logoW = Math.max(50, Math.round(w * 0.16 * state.scale));
    const aspect = (logo.naturalHeight || logo.height) / (logo.naturalWidth || logo.width);
    const logoH = Math.round(logoW * (aspect || 1));

    let x = 0;
    let y = 0;

    switch (state.position) {
      case 'top-right':
        x = w - margin - logoW;
        y = margin;
        break;
      case 'top-center':
        x = (w - logoW) / 2;
        y = margin;
        break;
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'middle-right':
        x = w - margin - logoW;
        y = (h - logoH) / 2;
        break;
      case 'center':
        x = (w - logoW) / 2;
        y = (h - logoH) / 2;
        break;
      case 'middle-left':
        x = margin;
        y = (h - logoH) / 2;
        break;
      case 'bottom-right':
        x = w - margin - logoW;
        y = h - margin - logoH;
        break;
      case 'bottom-center':
        x = (w - logoW) / 2;
        y = h - margin - logoH;
        break;
      case 'bottom-left':
        x = margin;
        y = h - margin - logoH;
        break;
      default:
        x = w - margin - logoW;
        y = h - margin - logoH;
    }

    ctx.save();
    const cx = x + logoW / 2;
    const cy = y + logoH / 2;
    ctx.translate(cx, cy);
    if (state.rotationDeg !== 0) {
      ctx.rotate((state.rotationDeg * Math.PI) / 180);
    }

    const drawX = -logoW / 2;
    const drawY = -logoH / 2;

    if (state.type === 'logo') {
      // Official Studio Round Logo with Golden Halo Ring
      const r = Math.min(logoW, logoH) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, drawX, drawY, logoW, logoH);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = Math.max(2, logoW * 0.035);
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 10;
      ctx.stroke();
    } else {
      ctx.drawImage(logo, drawX, drawY, logoW, logoH);
    }

    ctx.restore();
  }
}

/**
 * Tiled / Diagonal Pattern Watermark (Full Photo Copyright Protection)
 */
function drawTiledWatermark(ctx, w, h, state) {
  ctx.save();
  const angle = -28 * (Math.PI / 180);
  ctx.rotate(angle);

  const isText = state.type === 'text';
  const fontSize = Math.max(14, Math.round(w * 0.024 * state.scale));
  ctx.font = `bold ${fontSize}px 'Alexandria', 'Tajawal', sans-serif`;
  ctx.fillStyle = state.textColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.textBaseline = 'middle';

  const stepX = Math.max(160, Math.round(w * 0.28 * state.scale));
  const stepY = Math.max(90, Math.round(h * 0.16 * state.scale));
  const diag = Math.sqrt(w * w + h * h) * 1.6;

  for (let x = -diag; x < diag; x += stepX) {
    for (let y = -diag; y < diag; y += stepY) {
      if (isText) {
        ctx.fillText(state.text || '© استوديو الجوكر', x, y);
      } else {
        const logo = state.type === 'logo' ? wmState.defaultLogoImage : wmState.customLogoImage;
        if (logo && logo.complete) {
          const lSize = Math.max(34, Math.round(w * 0.08 * state.scale));
          ctx.drawImage(logo, x, y, lSize, lSize);
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Helper to draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Download Watermarked Image at full native resolution
 */
function downloadWatermarkedImage() {
  if (!wmState.sourceImage) {
    showToast('يرجى اختيار صورة أولاً!', 'warning');
    return;
  }

  showToast('جاري تصدير الصورة بدقتها الأصلية الكاملة...', 'info');

  const fullCanvas = document.createElement('canvas');
  drawWatermarkOnCanvas(fullCanvas, wmState.sourceImage, wmState);

  fullCanvas.toBlob((blob) => {
    if (!blob) {
      showToast('تعذر تصدير الصورة.', 'error');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = (wmState.sourceFilename || 'joker_photo').replace(/\.[^/.]+$/, '');
    a.download = `joker_protected_${baseName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast('تم تحميل الصورة المحمية بنجاح!', 'success');
  }, 'image/jpeg', 0.95);
}

/**
 * Send watermarked image to the main Cloudinary upload section
 */
function sendWatermarkedToUpload() {
  if (!wmState.sourceImage) {
    showToast('يرجى اختيار صورة أولاً!', 'warning');
    return;
  }

  const fullCanvas = document.createElement('canvas');
  drawWatermarkOnCanvas(fullCanvas, wmState.sourceImage, wmState);

  fullCanvas.toBlob((blob) => {
    if (!blob) {
      showToast('حدث خطأ أثناء إعداد الصورة للرفع.', 'error');
      return;
    }

    const filename = `watermarked_${wmState.sourceFilename || 'photo.jpg'}`;
    const file = new File([blob], filename, { type: 'image/jpeg' });

    // Load file into main upload dropzone
    processSelectedFile(file);

    // Smooth scroll to upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
      uploadForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showToast('تم إرسال الصورة المختومة بنجاح لنموذج الرفع! يمكنك الآن إضافة الوصف والرفع السحابي.', 'success');
  }, 'image/jpeg', 0.95);
}

/**
 * Gallery Picker Modal
 */
function openGalleryPickerModal() {
  const modal = document.getElementById('galleryPickerModal');
  const grid = document.getElementById('galleryPickerGrid');
  if (!modal || !grid) return;

  const items = galleryItems.length > 0 ? galleryItems : getSavedItems();
  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
        لا توجد صور في المعرض حالياً
      </div>
    `;
  } else {
    grid.innerHTML = items.map(item => `
      <div class="picker-thumb-card" onclick="selectGalleryImageForWatermark('${item.src}', '${escapeHtml(item.caption || 'عمل استوديو')}')">
        <img src="${item.src}" alt="${escapeHtml(item.caption)}" class="picker-thumb-img" loading="lazy">
        <span class="picker-thumb-caption">${escapeHtml(item.caption)}</span>
      </div>
    `).join('');
  }

  modal.classList.add('active');
}

function closeGalleryPickerModal() {
  const modal = document.getElementById('galleryPickerModal');
  if (modal) modal.classList.remove('active');
}

function selectGalleryImageForWatermark(src, caption) {
  closeGalleryPickerModal();
  showToast('جاري تحميل الصورة من المعرض...', 'info');

  wmState.sourceFilename = `${caption}.jpg`;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    wmState.sourceImage = img;
    onSourceImageLoaded();
  };
  img.onerror = () => {
    // If crossOrigin fetch blocked, load via proxy or regular Image
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      wmState.sourceImage = fallbackImg;
      onSourceImageLoaded();
    };
    fallbackImg.src = src;
  };
  img.src = src;
}

/**
 * Batch Files Selection Handler
 */
function handleWmBatchFilesSelected(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    handleWmBatchFilesList(Array.from(files));
  }
}

function handleWmBatchFilesList(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    showToast('يرجى اختيار ملفات صور فقط!', 'error');
    return;
  }

  wmState.batchFiles = imageFiles;

  // Set the first image as live preview
  loadWmImageFromFile(imageFiles[0]);

  // Update Batch UI
  const badge = document.getElementById('batchCountBadge');
  const list = document.getElementById('batchQueueList');
  const batchQueueBox = document.getElementById('batchQueueBox');

  if (badge) badge.textContent = imageFiles.length;
  if (batchQueueBox) batchQueueBox.style.display = 'block';

  if (list) {
    list.innerHTML = imageFiles.map((file, idx) => `
      <div class="batch-item-card">
        <div class="batch-item-details">
          <div class="batch-item-name">${escapeHtml(file.name)}</div>
          <div class="batch-item-status" id="batchStatus_${idx}">في الانتظار...</div>
        </div>
      </div>
    `).join('');
  }

  showToast(`تم تجهيز ${imageFiles.length} صورة للمعالجة الجماعية بالعلامة المائية!`, 'success');
}

/**
 * Process and download all batch images sequentially
 */
async function processAndDownloadBatch() {
  if (!wmState.batchFiles || wmState.batchFiles.length === 0) {
    showToast('لا توجد صور في قائمة المعالجة الجماعية!', 'warning');
    return;
  }

  const btn = document.getElementById('processBatchBtn');
  const progressBarBox = document.getElementById('batchProgressBarBox');
  const progressBar = document.getElementById('batchProgressBar');
  const statusText = document.getElementById('batchStatusText');
  const percentText = document.getElementById('batchPercentText');

  if (btn) btn.disabled = true;
  if (progressBarBox) progressBarBox.style.display = 'block';

  const total = wmState.batchFiles.length;
  showToast(`بدء معالجة وتحميل ${total} صورة بالعلامة المائية...`, 'info');

  for (let i = 0; i < total; i++) {
    const file = wmState.batchFiles[i];
    const pct = Math.round(((i + 1) / total) * 100);

    if (progressBar) progressBar.style.width = `${pct}%`;
    if (percentText) percentText.textContent = `${pct}%`;
    if (statusText) statusText.textContent = `جاري معالجة: ${file.name} (${i + 1}/${total})`;

    const itemStatus = document.getElementById(`batchStatus_${i}`);
    if (itemStatus) {
      itemStatus.textContent = 'جاري المعالجة والتحميل...';
      itemStatus.style.color = 'var(--gold-primary)';
    }

    try {
      const img = await loadImageFromFileAsync(file);
      const canvas = document.createElement('canvas');
      drawWatermarkOnCanvas(canvas, img, wmState);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.94));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `joker_protected_${cleanName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }

      if (itemStatus) {
        itemStatus.textContent = '✓ تم التحميل بنجاح';
        itemStatus.style.color = 'var(--color-success)';
      }

      // 450ms pause between downloads to prevent browser suppression
      await new Promise(res => setTimeout(res, 450));
    } catch (err) {
      console.error('Batch item error:', file.name, err);
      if (itemStatus) {
        itemStatus.textContent = '✗ حدث خطأ أثناء المعالجة';
        itemStatus.style.color = 'var(--color-danger)';
      }
    }
  }

  if (statusText) statusText.textContent = 'اكتملت جميع العمليات بنجاح!';
  if (btn) btn.disabled = false;
  showToast(`اكتملت معالجة وتحميل جميع الصور (${total}) بنجاح!`, 'success');
}

function loadImageFromFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* --------------------------------------------------------------------------
   ENTRY POINT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
