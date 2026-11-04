/**
 * SizeNotes - Mobile Measurement App
 * Single-Screen Application with Modal Popups Architecture (Zero Tabs)
 */

(function () {
  'use strict';

  // --- Storage Constants & Defaults ---
  const STORAGE_KEY = 'sizenotes_projects_v2';
  const ACTIVE_PROJECT_KEY = 'sizenotes_active_pid';

  // Starter Sample Projects
  const DEFAULT_PROJECTS = [
    {
      id: 'proj_room_01',
      title: 'Master Bedroom Remodel',
      client: 'Home Project',
      category: 'Interior',
      updatedAt: new Date().toISOString(),
      sketchData: null,
      items: [
        { id: 'm1', label: 'North Wall Length', value: '420', unit: 'cm', category: 'Walls', notes: 'Include baseboard gap', verified: true },
        { id: 'm2', label: 'East Wall Width', value: '345', unit: 'cm', category: 'Walls', notes: 'Clearance to doorway', verified: true },
        { id: 'm3', label: 'Ceiling Height', value: '260', unit: 'cm', category: 'Height', notes: 'Under crown molding', verified: true },
        { id: 'm4', label: 'Main Window Width', value: '180', unit: 'cm', category: 'Windows', notes: 'Recessed frame depth 15cm', verified: false },
        { id: 'm5', label: 'Window Sill Height', value: '85', unit: 'cm', category: 'Windows', notes: 'From finished floor', verified: false },
        { id: 'm6', label: 'Doorway Opening', value: '92', unit: 'cm', category: 'Doors', notes: 'Standard door leaf', verified: true },
        { id: 'm7', label: 'Closet Alcove Depth', value: '65', unit: 'cm', category: 'Storage', notes: 'For sliding wardrobe', verified: false }
      ]
    },
    {
      id: 'proj_suit_02',
      title: 'Bespoke Jacket & Trousers',
      client: 'Alex Morgan',
      category: 'Tailoring',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      sketchData: null,
      items: [
        { id: 't1', label: 'Chest Circumference', value: '40 1/2', unit: 'in', category: 'Upper Body', notes: 'Standard ease', verified: true },
        { id: 't2', label: 'Natural Waist', value: '33', unit: 'in', category: 'Torso', notes: 'Snug fit', verified: true },
        { id: 't3', label: 'Shoulder Seam to Seam', value: '18 1/4', unit: 'in', category: 'Shoulders', notes: 'Natural shoulder line', verified: true },
        { id: 't4', label: 'Sleeve Length', value: '25', unit: 'in', category: 'Arms', notes: 'Show 1/2" shirt cuff', verified: true },
        { id: 't5', label: 'Jacket Back Length', value: '29 1/2', unit: 'in', category: 'Length', notes: 'Cover seat', verified: true },
        { id: 't6', label: 'Trouser Inseam', value: '31', unit: 'in', category: 'Lower Body', notes: 'Slight break at shoe', verified: false }
      ]
    }
  ];

  // Preset Templates
  const TEMPLATES = {
    room: {
      title: 'Room & Interior Dimensions',
      category: 'Architecture',
      items: [
        { label: 'Room Length', value: '', unit: 'cm', category: 'Dimensions', notes: 'Wall to wall' },
        { label: 'Room Width', value: '', unit: 'cm', category: 'Dimensions', notes: 'Wall to wall' },
        { label: 'Ceiling Height', value: '', unit: 'cm', category: 'Dimensions', notes: 'Floor to ceiling' },
        { label: 'Main Window Width', value: '', unit: 'cm', category: 'Windows', notes: 'Frame outer edge' },
        { label: 'Main Window Height', value: '', unit: 'cm', category: 'Windows', notes: 'Frame outer edge' },
        { label: 'Door Opening Width', value: '', unit: 'cm', category: 'Doors', notes: 'Clear frame opening' },
        { label: 'Door Opening Height', value: '', unit: 'cm', category: 'Doors', notes: 'Clear frame opening' }
      ]
    },
    tailor: {
      title: 'Tailoring & Apparel Spec',
      category: 'Tailoring',
      items: [
        { label: 'Chest / Bust', value: '', unit: 'in', category: 'Upper Body', notes: 'Across fullest part' },
        { label: 'Natural Waist', value: '', unit: 'in', category: 'Torso', notes: 'Narrowest point' },
        { label: 'Hips / Seat', value: '', unit: 'in', category: 'Lower Body', notes: 'Fullest circumference' },
        { label: 'Shoulder Width', value: '', unit: 'in', category: 'Shoulders', notes: 'Bone to bone' },
        { label: 'Sleeve Outseam', value: '', unit: 'in', category: 'Arms', notes: 'Shoulder to wrist' },
        { label: 'Inseam', value: '', unit: 'in', category: 'Legs', notes: 'Crotch to hem' },
        { label: 'Outseam', value: '', unit: 'in', category: 'Legs', notes: 'Waistband to hem' },
        { label: 'Neck Circumference', value: '', unit: 'in', category: 'Neck', notes: 'Base of neck' }
      ]
    },
    woodwork: {
      title: 'Carpentry & Cut List',
      category: 'Woodworking',
      items: [
        { label: 'Overall Length', value: '', unit: 'mm', category: 'Assembly', notes: 'Finished outer edge' },
        { label: 'Overall Depth', value: '', unit: 'mm', category: 'Assembly', notes: 'Finished outer edge' },
        { label: 'Overall Height', value: '', unit: 'mm', category: 'Assembly', notes: 'Finished outer edge' },
        { label: 'Table Top Thickness', value: '', unit: 'mm', category: 'Top', notes: 'Hardwood plank' },
        { label: 'Leg Clearance', value: '', unit: 'mm', category: 'Legs', notes: 'Apron to floor' },
        { label: 'Shelf Inner Width', value: '', unit: 'mm', category: 'Shelving', notes: 'Dado to dado' },
        { label: 'Shelf Depth', value: '', unit: 'mm', category: 'Shelving', notes: 'With overhang' }
      ]
    },
    box: {
      title: 'Box & Package Freight',
      category: 'Logistics',
      items: [
        { label: 'Outer Length', value: '', unit: 'in', category: 'Outer', notes: 'Carton dimension' },
        { label: 'Outer Width', value: '', unit: 'in', category: 'Outer', notes: 'Carton dimension' },
        { label: 'Outer Height', value: '', unit: 'in', category: 'Outer', notes: 'Carton dimension' },
        { label: 'Inner Usable Depth', value: '', unit: 'in', category: 'Inner', notes: 'Clearance with foam' },
        { label: 'Gross Weight (lb)', value: '', unit: 'in', category: 'Weight', notes: 'Total packed' }
      ]
    }
  };

  // --- State ---
  let projects = [];
  let currentProject = null;
  let activeEditingItemId = null;
  let currentFilterCategory = 'ALL';
  let searchQuery = '';
  let sketchPad = null;

  // --- DOM Elements ---
  const el = {
    // Top Bar
    displayProjectTitle: document.getElementById('displayProjectTitle'),
    displayProjectCategory: document.getElementById('displayProjectCategory'),
    btnOpenProjects: document.getElementById('btnOpenProjects'),
    btnOpenSketch: document.getElementById('btnOpenSketch'),
    btnOpenTemplates: document.getElementById('btnOpenTemplates'),
    btnOpenConverter: document.getElementById('btnOpenConverter'),
    btnOpenPdf: document.getElementById('btnOpenPdf'),
    sketchBadgeDot: document.getElementById('sketchBadgeDot'),
    
    // Stats
    statItemCount: document.getElementById('statItemCount'),
    statVerifiedSub: document.getElementById('statVerifiedSub'),
    statMainUnit: document.getElementById('statMainUnit'),
    statUnitCount: document.getElementById('statUnitCount'),
    statTotalSum: document.getElementById('statTotalSum'),
    statGroupCount: document.getElementById('statGroupCount'),

    // Search & Category Dropdown
    searchBoxUnified: document.getElementById('searchBoxUnified'),
    searchCatDropdown: document.getElementById('searchCatDropdown'),
    searchCatBtn: document.getElementById('searchCatBtn'),
    searchCatLabel: document.getElementById('searchCatLabel'),
    searchCatMenu: document.getElementById('searchCatMenu'),
    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),

    // List & Empty state
    measurementList: document.getElementById('measurementList'),
    emptyState: document.getElementById('emptyState'),
    btnEmptyAdd: document.getElementById('btnEmptyAdd'),
    btnEmptyTemplate: document.getElementById('btnEmptyTemplate'),

    // Bottom Bar
    btnOpenAddMeasurement: document.getElementById('btnOpenAddMeasurement'),
    btnBottomPdf: document.getElementById('btnBottomPdf'),
    btnBottomSketch: document.getElementById('btnBottomSketch'),

    // Measurement Modal
    popupMeasurement: document.getElementById('popupMeasurement'),
    measurementModalTitle: document.getElementById('measurementModalTitle'),
    inputItemLabel: document.getElementById('inputItemLabel'),
    inputItemValue: document.getElementById('inputItemValue'),
    selectItemUnit: document.getElementById('selectItemUnit'),
    inputItemCategory: document.getElementById('inputItemCategory'),
    inputItemNotes: document.getElementById('inputItemNotes'),
    checkVerified: document.getElementById('checkVerified'),
    btnSaveMeasurement: document.getElementById('btnSaveMeasurement'),
    btnSaveAndNext: document.getElementById('btnSaveAndNext'),
    btnDeleteMeasurement: document.getElementById('btnDeleteMeasurement'),
    labelSuggestions: document.getElementById('labelSuggestions'),

    // Projects Modal
    popupProjects: document.getElementById('popupProjects'),
    projectListContainer: document.getElementById('projectListContainer'),
    inputNewProjectName: document.getElementById('inputNewProjectName'),
    btnCreateProject: document.getElementById('btnCreateProject'),
    btnExportData: document.getElementById('btnExportData'),
    importFileInput: document.getElementById('importFileInput'),

    // Sketch Modal
    popupSketch: document.getElementById('popupSketch'),
    sketchCanvas: document.getElementById('sketchCanvas'),
    sketchStatusLabel: document.getElementById('sketchStatusLabel'),
    btnSaveSketch: document.getElementById('btnSaveSketch'),
    btnRemoveSketch: document.getElementById('btnRemoveSketch'),
    toolPen: document.getElementById('toolPen'),
    toolLine: document.getElementById('toolLine'),
    toolArrow: document.getElementById('toolArrow'),
    toolRect: document.getElementById('toolRect'),
    toolEraser: document.getElementById('toolEraser'),
    toolUndo: document.getElementById('toolUndo'),
    toolClear: document.getElementById('toolClear'),

    // PDF Modal
    popupPdf: document.getElementById('popupPdf'),
    pdfTitleInput: document.getElementById('pdfTitleInput'),
    pdfClientInput: document.getElementById('pdfClientInput'),
    pdfIncludeSketch: document.getElementById('pdfIncludeSketch'),
    pdfIncludeSign: document.getElementById('pdfIncludeSign'),
    pdfLivePreview: document.getElementById('pdfLivePreview'),
    btnExecutePrint: document.getElementById('btnExecutePrint'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),
    btnCopyTextSummary: document.getElementById('btnCopyTextSummary'),

    // Templates Modal
    popupTemplates: document.getElementById('popupTemplates'),
    checkAppendTemplate: document.getElementById('checkAppendTemplate'),

    // Converter Modal
    popupConverter: document.getElementById('popupConverter'),
    convFromVal: document.getElementById('convFromVal'),
    convFromUnit: document.getElementById('convFromUnit'),
    convToVal: document.getElementById('convToVal'),
    convToUnit: document.getElementById('convToUnit'),
    btnSwapUnits: document.getElementById('btnSwapUnits'),
    fractionResult: document.getElementById('fractionResult'),
    calcL: document.getElementById('calcL'),
    calcW: document.getElementById('calcW'),
    calcH: document.getElementById('calcH'),
    calcAreaVal: document.getElementById('calcAreaVal'),
    calcPerimVal: document.getElementById('calcPerimVal'),
    calcVolVal: document.getElementById('calcVolVal'),

    // Print Container & Toast
    printPageLayout: document.getElementById('print-page-layout'),
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================================================
  // STORAGE & INITIALIZATION
  // ==========================================================================

  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        projects = JSON.parse(stored);
      } else {
        projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        saveData();
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
      projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    }

    const savedPid = localStorage.getItem(ACTIVE_PROJECT_KEY);
    currentProject = projects.find(p => p.id === savedPid) || projects[0] || null;

    if (!currentProject && projects.length > 0) {
      currentProject = projects[0];
    } else if (!currentProject) {
      createNewProject('My Measurement Sheet');
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      if (currentProject) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, currentProject.id);
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
      showToast('⚠️ Storage limit reached or private mode', 3000);
    }
  }

  function init() {
    loadData();
    renderAll();
    bindGlobalListeners();
    initSketchPad();
    initConverter();
    updatePdfPreview();
  }

  // ==========================================================================
  // POPUP MODAL MANAGER (Strictly NO TABS, Only Popups)
  // ==========================================================================

  function openPopup(modalElement) {
    if (!modalElement) return;
    closeAllPopups();
    modalElement.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-focus primary input if available
    setTimeout(() => {
      const input = modalElement.querySelector('input:not([type="checkbox"]):not([readonly]), textarea');
      if (input) input.focus();
    }, 150);
  }

  function closePopup(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('active');
    document.body.style.overflow = '';
  }

  function closeAllPopups() {
    document.querySelectorAll('.popup-overlay').forEach(popup => {
      popup.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // RENDERING ENGINE
  // ==========================================================================

  function renderAll() {
    renderHeaderAndStats();
    renderCategoryDropdown();
    renderMeasurementList();
    updatePdfPreview();
  }

  function renderHeaderAndStats() {
    if (!currentProject) return;

    el.displayProjectTitle.textContent = currentProject.title || 'Untitled Sheet';
    el.displayProjectCategory.textContent = currentProject.category || 'General';

    // Badge dot on sketch button if a sketch is saved
    const hasSketch = !!currentProject.sketchData;
    el.sketchBadgeDot.style.display = hasSketch ? 'block' : 'none';

    // Summary calculations
    const items = currentProject.items || [];
    const totalCount = items.length;
    const verifiedCount = items.filter(i => i.verified).length;

    el.statItemCount.textContent = totalCount;
    el.statVerifiedSub.textContent = `${verifiedCount} verified`;

    // Unit counts
    const unitMap = {};
    items.forEach(i => {
      const u = (i.unit || 'unit').toLowerCase();
      unitMap[u] = (unitMap[u] || 0) + 1;
    });

    let mainUnit = '—';
    let maxUnitCount = 0;
    for (const [u, count] of Object.entries(unitMap)) {
      if (count > maxUnitCount) {
        maxUnitCount = count;
        mainUnit = u;
      }
    }

    el.statMainUnit.textContent = mainUnit;
    const distinctUnits = Object.keys(unitMap).length;
    el.statUnitCount.textContent = `${distinctUnits} unit type${distinctUnits === 1 ? '' : 's'}`;

    // Total sum of measurements sharing dominant unit
    let sum = 0;
    let sumCount = 0;
    items.forEach(i => {
      if (i.unit === mainUnit) {
        const val = parseFractionOrDecimal(i.value);
        if (!isNaN(val)) {
          sum += val;
          sumCount++;
        }
      }
    });

    el.statTotalSum.textContent = sumCount > 0 ? (Math.round(sum * 100) / 100) + ' ' + mainUnit : '0';

    // Distinct categories
    const categories = new Set(items.map(i => i.category || 'General'));
    el.statGroupCount.textContent = `${categories.size} group${categories.size === 1 ? '' : 's'}`;
  }

  function parseFractionOrDecimal(valStr) {
    if (!valStr) return NaN;
    valStr = String(valStr).trim();
    if (!valStr) return NaN;

    // Direct decimal
    if (!isNaN(valStr)) return parseFloat(valStr);

    // Mixed fraction like "42 1/2" or "1/4"
    const parts = valStr.split(/\s+/);
    if (parts.length === 2 && parts[1].includes('/')) {
      const whole = parseFloat(parts[0]) || 0;
      const fracParts = parts[1].split('/');
      const num = parseFloat(fracParts[0]);
      const den = parseFloat(fracParts[1]);
      if (den !== 0) return whole + (num / den);
    } else if (parts.length === 1 && parts[0].includes('/')) {
      const fracParts = parts[0].split('/');
      const num = parseFloat(fracParts[0]);
      const den = parseFloat(fracParts[1]);
      if (den !== 0) return num / den;
    }
    return NaN;
  }

  function renderCategoryDropdown() {
    if (!currentProject) return;
    const items = currentProject.items || [];

    // Calculate counts per category
    const catCounts = { ALL: items.length };
    const distinctCats = [];
    items.forEach(i => {
      const c = i.category || 'General';
      if (!catCounts[c]) {
        catCounts[c] = 0;
        distinctCats.push(c);
      }
      catCounts[c]++;
    });

    // Check if currently selected category still exists, else reset to ALL
    if (currentFilterCategory !== 'ALL' && !catCounts[currentFilterCategory]) {
      currentFilterCategory = 'ALL';
    }

    // Update label & filter status on the dropdown button
    if (currentFilterCategory === 'ALL') {
      el.searchCatLabel.textContent = 'All';
      el.searchCatBtn.classList.remove('has-filter');
      el.searchCatBtn.title = 'Filter by Category (Showing All)';
    } else {
      el.searchCatLabel.textContent = currentFilterCategory;
      el.searchCatBtn.classList.add('has-filter');
      el.searchCatBtn.title = `Filtered by: ${currentFilterCategory}`;
    }

    // Populate dropdown options
    el.searchCatMenu.innerHTML = '';
    const allOptions = ['ALL', ...distinctCats];

    allOptions.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = cat === currentFilterCategory;
      btn.className = `cat-menu-item ${isActive ? 'active' : ''}`;
      
      const labelText = cat === 'ALL' ? 'All Categories' : cat;
      const count = catCounts[cat] || 0;

      btn.innerHTML = `
        <span class="cat-menu-name">
          ${isActive ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color:var(--accent-primary);"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          ${escapeHtml(labelText)}
        </span>
        <span class="cat-menu-count">${count}</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentFilterCategory = cat;
        closeCategoryDropdown();
        renderCategoryDropdown();
        renderMeasurementList();
      });

      el.searchCatMenu.appendChild(btn);
    });
  }

  function toggleCategoryDropdown(e) {
    if (e) e.stopPropagation();
    const isOpen = el.searchCatDropdown.classList.contains('open');
    if (isOpen) {
      closeCategoryDropdown();
    } else {
      openCategoryDropdown();
    }
  }

  function openCategoryDropdown() {
    el.searchCatDropdown.classList.add('open');
    el.searchBoxUnified.classList.add('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCategoryDropdown() {
    el.searchCatDropdown.classList.remove('open');
    el.searchBoxUnified.classList.remove('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'false');
  }

  function renderMeasurementList() {
    if (!currentProject) return;
    const items = currentProject.items || [];

    // Filter by category and search query
    const filtered = items.filter(item => {
      const matchesCategory = (currentFilterCategory === 'ALL') ||
        ((item.category || 'General') === currentFilterCategory);

      if (!matchesCategory) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const labelMatch = (item.label || '').toLowerCase().includes(q);
      const catMatch = (item.category || '').toLowerCase().includes(q);
      const valMatch = (item.value || '').toLowerCase().includes(q);
      const noteMatch = (item.notes || '').toLowerCase().includes(q);
      return labelMatch || catMatch || valMatch || noteMatch;
    });

    if (filtered.length === 0) {
      el.measurementList.innerHTML = '';
      el.emptyState.style.display = 'flex';
      return;
    }

    el.emptyState.style.display = 'none';
    el.measurementList.innerHTML = '';

    filtered.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `measurement-card ${item.verified ? 'verified' : ''}`;
      card.dataset.id = item.id;

      const num = String(index + 1).padStart(2, '0');
      const categoryTag = item.category ? `<span class="card-cat-badge">${escapeHtml(item.category)}</span>` : '';
      const notesLine = item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : '';

      card.innerHTML = `
        <div class="card-left">
          <div class="item-index">${num}</div>
          <div class="card-details">
            <div class="card-label-row">
              <span class="card-label">${escapeHtml(item.label)}</span>
              ${categoryTag}
            </div>
            ${notesLine}
          </div>
        </div>

        <div class="card-right">
          <div class="card-value-box">
            <span class="card-value">${escapeHtml(item.value || '0')}</span>
            <span class="card-unit">${escapeHtml(item.unit || '')}</span>
          </div>

          <button class="check-toggle-btn ${item.verified ? 'checked' : ''}" title="${item.verified ? 'Verified' : 'Mark verified'}" data-action="toggle-check">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      `;

      // Tap card opens edit popup
      card.addEventListener('click', (e) => {
        // Prevent if tap was specifically on check toggle button
        if (e.target.closest('[data-action="toggle-check"]')) {
          e.stopPropagation();
          toggleItemVerified(item.id);
          return;
        }
        openEditMeasurementModal(item);
      });

      el.measurementList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // MEASUREMENT ACTIONS (Add / Edit / Toggle / Delete)
  // ==========================================================================

  function openAddMeasurementModal() {
    activeEditingItemId = null;
    el.measurementModalTitle.querySelector('span').textContent = 'Add Measurement';
    el.btnDeleteMeasurement.style.display = 'none';
    el.btnSaveAndNext.style.display = 'inline-flex';

    // Clear fields or set smart defaults based on previous item
    el.inputItemLabel.value = '';
    el.inputItemValue.value = '';
    el.inputItemNotes.value = '';
    el.checkVerified.checked = false;

    // Retain last used unit and category for quick consecutive note taking
    const lastItem = currentProject.items && currentProject.items[currentProject.items.length - 1];
    if (lastItem) {
      el.selectItemUnit.value = lastItem.unit || 'cm';
      el.inputItemCategory.value = lastItem.category || '';
    } else {
      el.selectItemUnit.value = 'cm';
      el.inputItemCategory.value = 'General';
    }

    openPopup(el.popupMeasurement);
  }

  function openEditMeasurementModal(item) {
    activeEditingItemId = item.id;
    el.measurementModalTitle.querySelector('span').textContent = 'Edit Measurement';
    el.btnDeleteMeasurement.style.display = 'inline-flex';
    el.btnSaveAndNext.style.display = 'none';

    el.inputItemLabel.value = item.label || '';
    el.inputItemValue.value = item.value || '';
    el.selectItemUnit.value = item.unit || 'cm';
    el.inputItemCategory.value = item.category || '';
    el.inputItemNotes.value = item.notes || '';
    el.checkVerified.checked = !!item.verified;

    openPopup(el.popupMeasurement);
  }

  function saveCurrentMeasurement(andNext = false) {
    const label = el.inputItemLabel.value.trim();
    const value = el.inputItemValue.value.trim();
    const unit = el.selectItemUnit.value;
    const category = el.inputItemCategory.value.trim() || 'General';
    const notes = el.inputItemNotes.value.trim();
    const verified = el.checkVerified.checked;

    if (!label) {
      showToast('⚠️ Please enter a dimension or item label');
      el.inputItemLabel.focus();
      return;
    }

    if (!value) {
      showToast('⚠️ Please enter a measurement value');
      el.inputItemValue.focus();
      return;
    }

    if (!currentProject.items) {
      currentProject.items = [];
    }

    if (activeEditingItemId) {
      // Update existing
      const item = currentProject.items.find(i => i.id === activeEditingItemId);
      if (item) {
        item.label = label;
        item.value = value;
        item.unit = unit;
        item.category = category;
        item.notes = notes;
        item.verified = verified;
        showToast('✓ Measurement updated');
      }
      currentProject.updatedAt = new Date().toISOString();
      saveData();
      renderAll();
      closePopup(el.popupMeasurement);
    } else {
      // Add new
      const newItem = {
        id: 'm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        label,
        value,
        unit,
        category,
        notes,
        verified,
        createdAt: new Date().toISOString()
      };
      currentProject.items.push(newItem);
      currentProject.updatedAt = new Date().toISOString();
      saveData();
      renderAll();
      showToast('✓ Measurement added');

      if (andNext) {
        // Reset only label and value for rapid note taking
        el.inputItemLabel.value = '';
        el.inputItemValue.value = '';
        el.inputItemNotes.value = '';
        el.checkVerified.checked = false;
        el.inputItemLabel.focus();
      } else {
        closePopup(el.popupMeasurement);
      }
    }
  }

  function deleteCurrentMeasurement() {
    if (!activeEditingItemId || !currentProject) return;
    currentProject.items = currentProject.items.filter(i => i.id !== activeEditingItemId);
    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderAll();
    closePopup(el.popupMeasurement);
    showToast('Item deleted');
  }

  function toggleItemVerified(itemId) {
    if (!currentProject || !currentProject.items) return;
    const item = currentProject.items.find(i => i.id === itemId);
    if (item) {
      item.verified = !item.verified;
      currentProject.updatedAt = new Date().toISOString();
      saveData();
      renderAll();
    }
  }

  // ==========================================================================
  // PROJECT / SHEET MANAGER (Modal)
  // ==========================================================================

  function openProjectsModal() {
    renderProjectList();
    el.inputNewProjectName.value = '';
    openPopup(el.popupProjects);
  }

  function renderProjectList() {
    el.projectListContainer.innerHTML = '';
    projects.forEach(proj => {
      const isActive = currentProject && proj.id === currentProject.id;
      const count = (proj.items || []).length;
      const itemEl = document.createElement('div');
      itemEl.className = `project-item ${isActive ? 'active' : ''}`;
      
      const updatedDate = proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : '';

      itemEl.innerHTML = `
        <div class="project-item-left">
          <div class="project-item-name">
            ${escapeHtml(proj.title)}
            ${isActive ? '<span style="font-size:0.7rem; color:var(--accent-primary); margin-left:6px;">[Active]</span>' : ''}
          </div>
          <div class="project-item-meta">${count} measurements &bull; ${escapeHtml(proj.category || 'General')} &bull; ${updatedDate}</div>
        </div>
        <div class="project-item-actions">
          <button class="icon-btn" data-proj-id="${proj.id}" data-action="duplicate" title="Duplicate project" style="width:32px;height:32px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          ${projects.length > 1 ? `
          <button class="icon-btn" data-proj-id="${proj.id}" data-action="delete" title="Delete project" style="width:32px;height:32px;color:var(--danger);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>` : ''}
        </div>
      `;

      // Tap on project row switches active project
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        switchActiveProject(proj.id);
        closePopup(el.popupProjects);
      });

      // Actions
      const dupBtn = itemEl.querySelector('[data-action="duplicate"]');
      if (dupBtn) {
        dupBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          duplicateProject(proj.id);
        });
      }

      const delBtn = itemEl.querySelector('[data-action="delete"]');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProject(proj.id);
        });
      }

      el.projectListContainer.appendChild(itemEl);
    });
  }

  function switchActiveProject(projectId) {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      currentProject = proj;
      currentFilterCategory = 'ALL';
      searchQuery = '';
      el.searchInput.value = '';
      saveData();
      renderAll();
      showToast(`Switched to: ${proj.title}`);
    }
  }

  function createNewProject(title) {
    title = (title || '').trim() || 'New Measurement Sheet';
    const newProj = {
      id: 'proj_' + Date.now().toString(36),
      title: title,
      client: '',
      category: 'General',
      updatedAt: new Date().toISOString(),
      sketchData: null,
      items: []
    };
    projects.unshift(newProj);
    currentProject = newProj;
    currentFilterCategory = 'ALL';
    searchQuery = '';
    saveData();
    renderAll();
    showToast(`Created: ${title}`);
  }

  function duplicateProject(projectId) {
    const orig = projects.find(p => p.id === projectId);
    if (!orig) return;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'proj_' + Date.now().toString(36);
    copy.title = `${orig.title} (Copy)`;
    copy.updatedAt = new Date().toISOString();
    projects.unshift(copy);
    switchActiveProject(copy.id);
    renderProjectList();
    showToast('Project duplicated');
  }

  function deleteProject(projectId) {
    if (projects.length <= 1) {
      showToast('⚠️ Cannot delete the only project sheet');
      return;
    }
    if (!confirm('Are you sure you want to delete this sheet?')) return;
    projects = projects.filter(p => p.id !== projectId);
    if (currentProject && currentProject.id === projectId) {
      currentProject = projects[0];
    }
    saveData();
    renderAll();
    renderProjectList();
    showToast('Project sheet removed');
  }

  // ==========================================================================
  // SKETCH & DIAGRAM DOODLE PAD (Modal)
  // ==========================================================================

  function initSketchPad() {
    sketchPad = new window.SketchPad('sketchCanvas');

    // Tool Buttons
    const tools = [
      { btn: el.toolPen, name: 'pen' },
      { btn: el.toolLine, name: 'line' },
      { btn: el.toolArrow, name: 'arrow' },
      { btn: el.toolRect, name: 'rect' },
      { btn: el.toolEraser, name: 'eraser' }
    ];

    tools.forEach(t => {
      t.btn.addEventListener('click', () => {
        tools.forEach(o => o.btn.classList.remove('active'));
        t.btn.classList.add('active');
        sketchPad.tool = t.name;
      });
    });

    // Colors
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        sketchPad.color = dot.dataset.color;
      });
    });

    // Undo / Clear
    el.toolUndo.addEventListener('click', () => sketchPad.undo());
    el.toolClear.addEventListener('click', () => {
      if (confirm('Clear entire sketch?')) {
        sketchPad.clear();
      }
    });

    // Save Sketch to Project
    el.btnSaveSketch.addEventListener('click', () => {
      if (!currentProject) return;
      currentProject.sketchData = sketchPad.toDataURL();
      currentProject.updatedAt = new Date().toISOString();
      saveData();
      renderAll();
      closePopup(el.popupSketch);
      showToast('✓ Diagram saved to sheet');
    });

    // Remove Sketch
    el.btnRemoveSketch.addEventListener('click', () => {
      if (!currentProject) return;
      currentProject.sketchData = null;
      currentProject.updatedAt = new Date().toISOString();
      saveData();
      renderAll();
      sketchPad.clear();
      closePopup(el.popupSketch);
      showToast('Diagram removed');
    });
  }

  function openSketchModal() {
    openPopup(el.popupSketch);
    setTimeout(() => {
      sketchPad.initCanvasSize();
      if (currentProject && currentProject.sketchData) {
        sketchPad.loadFromDataURL(currentProject.sketchData);
        el.sketchStatusLabel.textContent = 'Diagram saved with sheet';
      } else {
        sketchPad.clear();
        el.sketchStatusLabel.textContent = 'No sketch saved';
      }
    }, 100);
  }

  // ==========================================================================
  // PDF GENERATION & PRINT (Single Screen & Single Page PDF)
  // ==========================================================================

  function openPdfModal() {
    if (!currentProject) return;
    el.pdfTitleInput.value = currentProject.title ? `MEASUREMENT SHEET: ${currentProject.title.toUpperCase()}` : 'MEASUREMENT SPECIFICATION SHEET';
    el.pdfClientInput.value = currentProject.client || '';
    updatePdfPreview();
    openPopup(el.popupPdf);
  }

  function updatePdfPreview() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    const options = {
      title: el.pdfTitleInput.value || 'MEASUREMENT SHEET',
      client: el.pdfClientInput.value || 'General',
      includeSketch: el.pdfIncludeSketch.checked,
      includeSignature: el.pdfIncludeSign.checked
    };

    // Render into preview container
    el.pdfLivePreview.innerHTML = window.PDFGenerator.renderPrintDOM(
      currentProject,
      items,
      currentProject.sketchData,
      options
    );

    // Also populate hidden #print-page-layout for native @media print
    el.printPageLayout.innerHTML = window.PDFGenerator.renderPrintDOM(
      currentProject,
      items,
      currentProject.sketchData,
      options
    );
  }

  function executePrint() {
    updatePdfPreview();
    // Native print triggers OS / Browser PDF print dialog formatted via @media print
    window.print();
  }

  function downloadPdfFile() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    const options = {
      title: el.pdfTitleInput.value || 'MEASUREMENT SPECIFICATION SHEET',
      client: el.pdfClientInput.value || 'General',
      includeSketch: el.pdfIncludeSketch.checked,
      includeSignature: el.pdfIncludeSign.checked
    };
    window.PDFGenerator.downloadPDF(currentProject, items, options);
    showToast('✓ PDF download started');
  }

  function copyTextSummary() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    let text = `📐 ${currentProject.title.toUpperCase()}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (currentProject.client) text += `Client: ${currentProject.client}\n`;
    text += `------------------------------------\n`;

    items.forEach((item, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const v = item.verified ? ' [✓]' : '';
      text += `${num}. ${item.label}: ${item.value} ${item.unit || ''}${v}`;
      if (item.notes) text += ` (${item.notes})`;
      text += `\n`;
    });

    text += `------------------------------------\n`;
    text += `Total items: ${items.length}\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Measurement summary copied to clipboard');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✓ Copied to clipboard');
  }

  // ==========================================================================
  // TEMPLATES (Modal)
  // ==========================================================================

  function openTemplatesModal() {
    openPopup(el.popupTemplates);
  }

  function applyTemplate(templateKey) {
    const tmpl = TEMPLATES[templateKey];
    if (!tmpl || !currentProject) return;

    const append = el.checkAppendTemplate.checked;
    if (!append) {
      if (currentProject.items.length > 0 && !confirm('Replace existing measurements with this template?')) {
        return;
      }
      currentProject.items = [];
    }

    tmpl.items.forEach(item => {
      currentProject.items.push({
        id: 'm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        label: item.label,
        value: item.value || '0',
        unit: item.unit || 'cm',
        category: item.category || 'General',
        notes: item.notes || '',
        verified: false,
        createdAt: new Date().toISOString()
      });
    });

    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderAll();
    closePopup(el.popupTemplates);
    showToast(`✓ Loaded template: ${tmpl.title}`);
  }

  // ==========================================================================
  // UNIT CONVERTER & CALCULATOR (Modal)
  // ==========================================================================

  function initConverter() {
    const convert = () => {
      const val = parseFloat(el.convFromVal.value) || 0;
      const from = el.convFromUnit.value;
      const to = el.convToUnit.value;

      // Base conversion to millimeters
      const toMm = {
        mm: 1,
        cm: 10,
        m: 1000,
        in: 25.4,
        ft: 304.8
      };

      const mmVal = val * (toMm[from] || 1);
      const result = mmVal / (toMm[to] || 1);
      
      const rounded = Math.round(result * 1000) / 1000;
      el.convToVal.value = rounded;

      // Fractional inches breakdown if target is inches
      if (to === 'in') {
        const whole = Math.floor(rounded);
        const frac = rounded - whole;
        const sixteenths = Math.round(frac * 16);
        if (sixteenths === 0) {
          el.fractionResult.textContent = `Exact: ${whole}"`;
        } else if (sixteenths === 16) {
          el.fractionResult.textContent = `Exact: ${whole + 1}"`;
        } else {
          // Simplify fraction
          let num = sixteenths;
          let den = 16;
          while (num % 2 === 0 && den % 2 === 0) {
            num /= 2;
            den /= 2;
          }
          el.fractionResult.textContent = `Fraction: ${whole > 0 ? whole + ' ' : ''}${num}/${den}"`;
        }
      } else {
        el.fractionResult.textContent = '';
      }
    };

    const calculateGeometry = () => {
      const l = parseFloat(el.calcL.value) || 0;
      const w = parseFloat(el.calcW.value) || 0;
      const h = parseFloat(el.calcH.value) || 0;

      const area = l * w;
      const perim = 2 * (l + w);
      const vol = l * w * h;

      el.calcAreaVal.textContent = (Math.round(area * 100) / 100).toLocaleString();
      el.calcPerimVal.textContent = (Math.round(perim * 100) / 100).toLocaleString();
      el.calcVolVal.textContent = (Math.round(vol * 100) / 100).toLocaleString();
    };

    el.convFromVal.addEventListener('input', convert);
    el.convFromUnit.addEventListener('change', convert);
    el.convToUnit.addEventListener('change', convert);

    el.btnSwapUnits.addEventListener('click', () => {
      const temp = el.convFromUnit.value;
      el.convFromUnit.value = el.convToUnit.value;
      el.convToUnit.value = temp;
      convert();
    });

    el.calcL.addEventListener('input', calculateGeometry);
    el.calcW.addEventListener('input', calculateGeometry);
    el.calcH.addEventListener('input', calculateGeometry);

    convert();
    calculateGeometry();
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================

  function bindGlobalListeners() {
    // Popup triggers
    el.btnOpenAddMeasurement.addEventListener('click', openAddMeasurementModal);
    el.btnEmptyAdd.addEventListener('click', openAddMeasurementModal);
    
    el.btnOpenProjects.addEventListener('click', openProjectsModal);
    el.btnOpenSketch.addEventListener('click', openSketchModal);
    el.btnBottomSketch.addEventListener('click', openSketchModal);
    
    el.btnOpenTemplates.addEventListener('click', openTemplatesModal);
    el.btnEmptyTemplate.addEventListener('click', openTemplatesModal);
    
    el.btnOpenConverter.addEventListener('click', () => openPopup(el.popupConverter));
    
    el.btnOpenPdf.addEventListener('click', openPdfModal);
    el.btnBottomPdf.addEventListener('click', openPdfModal);

    // Close buttons on all popups
    document.querySelectorAll('[data-close-popup]').forEach(btn => {
      btn.addEventListener('click', () => {
        const popup = btn.closest('.popup-overlay');
        closePopup(popup);
      });
    });

    // Close when tapping backdrop outside the sheet
    document.querySelectorAll('.popup-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closePopup(overlay);
        }
      });
    });

    // Category dropdown toggle inside search bar
    el.searchCatBtn.addEventListener('click', toggleCategoryDropdown);

    // Close category dropdown on click outside
    document.addEventListener('click', (e) => {
      if (el.searchCatDropdown && !el.searchCatDropdown.contains(e.target)) {
        closeCategoryDropdown();
      }
    });

    // Keyboard navigation (ESC closes popup & dropdowns)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCategoryDropdown();
        closeAllPopups();
      }
    });

    // Measurement modal actions
    el.btnSaveMeasurement.addEventListener('click', () => saveCurrentMeasurement(false));
    el.btnSaveAndNext.addEventListener('click', () => saveCurrentMeasurement(true));
    el.btnDeleteMeasurement.addEventListener('click', deleteCurrentMeasurement);

    // Label suggestions chips
    el.labelSuggestions.querySelectorAll('.sugg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.inputItemLabel.value = chip.dataset.label;
        el.inputItemValue.focus();
      });
    });

    // Quick increment helpers
    document.querySelectorAll('[data-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inc = parseFloat(btn.dataset.inc) || 0;
        let curr = parseFloat(el.inputItemValue.value) || 0;
        curr = Math.max(0, Math.round((curr + inc) * 100) / 100);
        el.inputItemValue.value = curr;
      });
    });

    // Quick fraction helpers
    document.querySelectorAll('[data-frac]').forEach(btn => {
      btn.addEventListener('click', () => {
        const frac = btn.dataset.frac;
        const current = el.inputItemValue.value.trim();
        // If current is an integer, append fraction e.g. "42" + " 1/2"
        if (/^\d+$/.test(current)) {
          el.inputItemValue.value = current + frac;
        } else {
          el.inputItemValue.value = frac.trim();
        }
      });
    });

    // Search bar
    el.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      el.btnClearSearch.style.display = searchQuery ? 'block' : 'none';
      renderMeasurementList();
    });

    el.btnClearSearch.addEventListener('click', () => {
      el.searchInput.value = '';
      searchQuery = '';
      el.btnClearSearch.style.display = 'none';
      renderMeasurementList();
    });

    // Create Project
    el.btnCreateProject.addEventListener('click', () => {
      const name = el.inputNewProjectName.value.trim();
      if (!name) {
        showToast('⚠️ Please enter a project title');
        return;
      }
      createNewProject(name);
      renderProjectList();
      closePopup(el.popupProjects);
    });

    // Templates selection
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.template;
        applyTemplate(key);
      });
    });

    // PDF options changes
    el.pdfTitleInput.addEventListener('input', updatePdfPreview);
    el.pdfClientInput.addEventListener('input', updatePdfPreview);
    el.pdfIncludeSketch.addEventListener('change', updatePdfPreview);
    el.pdfIncludeSign.addEventListener('change', updatePdfPreview);

    el.btnExecutePrint.addEventListener('click', executePrint);
    el.btnDownloadPdf.addEventListener('click', downloadPdfFile);
    el.btnCopyTextSummary.addEventListener('click', copyTextSummary);

    // Export / Import Backup JSON
    el.btnExportData.addEventListener('click', exportBackup);
    el.importFileInput.addEventListener('change', importBackup);

    // Ensure printable DOM is ready before any print action
    window.addEventListener('beforeprint', updatePdfPreview);
  }

  // ==========================================================================
  // BACKUP EXPORT & IMPORT
  // ==========================================================================

  function exportBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `sizenotes-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('✓ Backup file exported');
  }

  function importBackup(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          projects = imported;
          currentProject = projects[0] || null;
          saveData();
          renderAll();
          renderProjectList();
          showToast('✓ Backup restored successfully');
        } else {
          showToast('⚠️ Invalid backup file format');
        }
      } catch (err) {
        showToast('⚠️ Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================

  function showToast(message, duration = 2200) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // --- Run on Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
