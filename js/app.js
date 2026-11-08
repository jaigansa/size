/**
 * SizeNotes - Mobile Measurement App
 * Single-Screen Application with Modal Popups Architecture (Zero Tabs)
 * Enhanced with Photo Backdrop, Dimension Stamp, Drag/Reorder,
 * Native Share Sheet, CSV Export, Batch Unit Conversion, Custom Templates,
 * Multi-Dimension 2D/3D Mode, Contractor Branding, and Undo Deletion.
 */

(function () {
  'use strict';

  // --- Storage Constants & Defaults ---
  const STORAGE_KEY = 'sizenotes_projects_v2';
  const ACTIVE_PROJECT_KEY = 'sizenotes_active_pid';
  const CUSTOM_TEMPLATES_KEY = 'sizenotes_custom_templates_v1';
  const BRANDING_KEY = 'sizenotes_branding_v1';
  const THEME_KEY = 'sizenotes_theme_v1';

  // Default Initial Project (Clean, zero preloaded items)
  const DEFAULT_PROJECTS = [
    {
      id: 'proj_default_01',
      title: 'New Measurement Sheet',
      client: '',
      category: 'General',
      updatedAt: new Date().toISOString(),
      sketchData: null,
      items: []
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
  let lastDeletedItem = null;
  let activeDimMode = '1d'; // '1d', '2d', '3d'
  let customTemplates = [];
  let companyBranding = { name: '', contact: '', logo: null };

  // --- DOM Elements ---
  const el = {
    // Top Bar
    displayProjectTitle: document.getElementById('displayProjectTitle'),
    displayProjectCategory: document.getElementById('displayProjectCategory'),
    btnOpenProjects: document.getElementById('btnOpenProjects'),
    btnOpenTheme: document.getElementById('btnOpenTheme'),
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
    dimModeTabs: document.getElementById('dimModeTabs'),
    compositeInputsBox: document.getElementById('compositeInputsBox'),
    compositeInputsGrid: document.getElementById('compositeInputsGrid'),
    inputDimL: document.getElementById('inputDimL'),
    inputDimW: document.getElementById('inputDimW'),
    inputDimH: document.getElementById('inputDimH'),
    colDimH: document.getElementById('colDimH'),
    sepDimW: document.getElementById('sepDimW'),
    sepDimH: document.getElementById('sepDimH'),
    dimSectionTitle: document.getElementById('dimSectionTitle'),
    compositeCalcBadge: document.getElementById('compositeCalcBadge'),
    singleValueGrid: document.getElementById('singleValueGrid'),
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
    toolText: document.getElementById('toolText'),
    toolEraser: document.getElementById('toolEraser'),
    btnSketchPhoto: document.getElementById('btnSketchPhoto'),
    sketchPhotoInput: document.getElementById('sketchPhotoInput'),
    toolUndo: document.getElementById('toolUndo'),
    toolClear: document.getElementById('toolClear'),

    // PDF Modal
    popupPdf: document.getElementById('popupPdf'),
    pdfTitleInput: document.getElementById('pdfTitleInput'),
    pdfClientInput: document.getElementById('pdfClientInput'),
    pdfCompanyInput: document.getElementById('pdfCompanyInput'),
    pdfContactInput: document.getElementById('pdfContactInput'),
    pdfLogoInput: document.getElementById('pdfLogoInput'),
    pdfLogoPreviewContainer: document.getElementById('pdfLogoPreviewContainer'),
    pdfLogoPreview: document.getElementById('pdfLogoPreview'),
    btnClearLogo: document.getElementById('btnClearLogo'),
    pdfIncludeSketch: document.getElementById('pdfIncludeSketch'),
    pdfIncludeSign: document.getElementById('pdfIncludeSign'),
    pdfLivePreview: document.getElementById('pdfLivePreview'),
    btnShareSheet: document.getElementById('btnShareSheet'),
    btnExecutePrint: document.getElementById('btnExecutePrint'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),
    btnDownloadCsv: document.getElementById('btnDownloadCsv'),
    btnCopyTextSummary: document.getElementById('btnCopyTextSummary'),

    // Templates Modal
    popupTemplates: document.getElementById('popupTemplates'),
    checkAppendTemplate: document.getElementById('checkAppendTemplate'),
    btnSaveSheetAsTemplate: document.getElementById('btnSaveSheetAsTemplate'),
    customTemplatesContainer: document.getElementById('customTemplatesContainer'),

    // Theme Modal
    popupTheme: document.getElementById('popupTheme'),

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
    selectBatchTargetUnit: document.getElementById('selectBatchTargetUnit'),
    btnBatchConvertUnits: document.getElementById('btnBatchConvertUnits'),

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
        // Clear out legacy preloaded default items from starter sample sheets
        let modified = false;
        if (Array.isArray(projects)) {
          projects.forEach(p => {
            if (p.id === 'proj_room_01' || p.id === 'proj_suit_02') {
              if (p.items && p.items.length > 0 && p.items.some(i => i.id === 'm1' || i.id === 't1')) {
                p.items = [];
                p.title = 'New Measurement Sheet';
                p.client = '';
                p.category = 'General';
                modified = true;
              }
            }
          });
        }
        if (modified) {
          saveData();
        }
      } else {
        projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        saveData();
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
      projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    }

    if (!projects || projects.length === 0) {
      projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    }

    const savedPid = localStorage.getItem(ACTIVE_PROJECT_KEY);
    currentProject = projects.find(p => p.id === savedPid) || projects[0] || null;

    loadBranding();
    loadCustomTemplates();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      if (currentProject) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, currentProject.id);
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  function loadBranding() {
    try {
      const stored = localStorage.getItem(BRANDING_KEY);
      if (stored) {
        companyBranding = JSON.parse(stored);
      }
    } catch (e) {
      companyBranding = { name: '', contact: '', logo: null };
    }
    if (el.pdfCompanyInput) el.pdfCompanyInput.value = companyBranding.name || '';
    if (el.pdfContactInput) el.pdfContactInput.value = companyBranding.contact || '';
    renderLogoPreview();
  }

  function saveBranding() {
    companyBranding.name = (el.pdfCompanyInput ? el.pdfCompanyInput.value.trim() : '');
    companyBranding.contact = (el.pdfContactInput ? el.pdfContactInput.value.trim() : '');
    try {
      localStorage.setItem(BRANDING_KEY, JSON.stringify(companyBranding));
    } catch (e) {
      console.warn('Failed to save branding:', e);
    }
  }

  function renderLogoPreview() {
    if (companyBranding.logo) {
      el.pdfLogoPreview.src = companyBranding.logo;
      el.pdfLogoPreviewContainer.style.display = 'inline-flex';
    } else {
      el.pdfLogoPreview.src = '';
      el.pdfLogoPreviewContainer.style.display = 'none';
    }
  }

  function loadCustomTemplates() {
    try {
      const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      customTemplates = stored ? JSON.parse(stored) : [];
    } catch (e) {
      customTemplates = [];
    }
    renderCustomTemplates();
  }

  function saveCustomTemplates() {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    } catch (e) {
      console.warn('Failed to save custom templates:', e);
    }
    renderCustomTemplates();
  }

  function init() {
    loadData();
    initTheme();
    initSketchPad();
    initConverter();
    bindGlobalListeners();
    renderAll();

    // Register Service Worker for offline PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration skipped or failed:', err);
      });
    }
  }

  // ==========================================================================
  // COLOR THEMES SYSTEM
  // ==========================================================================

  function initTheme() {
    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      savedTheme = 'light';
    }
    applyTheme(savedTheme, false);

    if (el.btnOpenTheme) {
      el.btnOpenTheme.addEventListener('click', () => openPopup(el.popupTheme));
    }

    if (el.popupTheme) {
      el.popupTheme.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
          const theme = card.dataset.theme;
          applyTheme(theme, true);
          closePopup(el.popupTheme);
        });
      });
    }
  }

  function applyTheme(themeName, showToastMsg = true) {
    const validThemes = ['light', 'obsidian', 'blueprint', 'workshop', 'emerald'];
    if (!validThemes.includes(themeName)) {
      if (themeName === 'sunlight' || themeName === 'white') themeName = 'light';
      else themeName = 'light';
    }

    document.documentElement.dataset.theme = themeName;
    try {
      localStorage.setItem(THEME_KEY, themeName);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }

    const themeColors = {
      light: '#ffffff',
      obsidian: '#070a10',
      blueprint: '#0a1324',
      workshop: '#121316',
      emerald: '#071510'
    };
    const metaColor = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
    if (metaColor) {
      metaColor.setAttribute('content', themeColors[themeName] || '#ffffff');
    }

    if (el.popupTheme) {
      el.popupTheme.querySelectorAll('.theme-card').forEach(c => {
        c.classList.toggle('active', c.dataset.theme === themeName);
      });
    }

    if (showToastMsg) {
      const names = {
        light: 'Clean White',
        obsidian: 'Obsidian Azure',
        blueprint: 'Blueprint Tech',
        workshop: 'Workshop Amber',
        emerald: 'Emerald Craft'
      };
      showToast(`✓ Color theme: ${names[themeName] || themeName}`);
    }
  }

  // ==========================================================================
  // MODAL / POPUP CONTROLLER (Zero Tabs - Pure Popups)
  // ==========================================================================

  function openPopup(modalElement) {
    if (!modalElement) return;
    closeCategoryDropdown();
    modalElement.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-focus first meaningful field
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
    document.querySelectorAll('.popup-overlay').forEach(p => p.classList.remove('active'));
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // RENDER ENGINE (Single Screen Layout)
  // ==========================================================================

  function renderAll() {
    if (!currentProject && projects.length > 0) {
      currentProject = projects[0];
    }

    renderHeaderAndStats();
    renderCategoryDropdown();
    renderMeasurementList();
  }

  function renderHeaderAndStats() {
    if (!currentProject) return;

    el.displayProjectTitle.textContent = currentProject.title || 'Untitled Sheet';
    el.displayProjectCategory.textContent = currentProject.category || 'General';

    // Visual Sketch Dot Indicator
    const hasSketch = !!currentProject.sketchData;
    if (el.sketchBadgeDot) {
      el.sketchBadgeDot.style.display = hasSketch ? 'block' : 'none';
    }

    // Calculate Summary Stats
    const items = currentProject.items || [];
    const totalCount = items.length;
    const verifiedCount = items.filter(i => i.verified).length;
    
    el.statItemCount.textContent = totalCount;
    el.statVerifiedSub.textContent = `${verifiedCount} verified`;

    // Detect primary unit
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
    const distinctUnits = Object.keys(unitMap).length;
    el.statMainUnit.textContent = mainUnit;
    el.statUnitCount.textContent = `${distinctUnits} unit${distinctUnits === 1 ? '' : 's'}`;

    // Sum of primary unit items
    let sum = 0;
    let sumCount = 0;
    items.forEach(i => {
      if ((i.unit || '').toLowerCase() === mainUnit) {
        const val = parseFractionOrDecimal(i.value);
        if (!isNaN(val)) {
          sum += val;
          sumCount++;
        }
      }
    });

    el.statTotalSum.textContent = sumCount > 0 ? (Math.round(sum * 100) / 100) : '0';
    const categories = new Set(items.map(i => i.category || 'General'));
    el.statGroupCount.textContent = `${categories.size} group${categories.size === 1 ? '' : 's'}`;
  }

  function parseFractionOrDecimal(valStr) {
    if (!valStr) return NaN;
    valStr = String(valStr).trim();

    // If composite (e.g. 120 × 80), take first number for summation
    if (valStr.includes('×') || valStr.includes('x') || valStr.includes('X')) {
      valStr = valStr.split(/[×xX]/)[0].trim();
    }

    // Handle mixed fraction e.g. "40 1/2"
    if (valStr.includes(' ')) {
      const parts = valStr.split(/\s+/);
      const whole = parseFloat(parts[0]) || 0;
      if (parts[1] && parts[1].includes('/')) {
        const fracParts = parts[1].split('/');
        const num = parseFloat(fracParts[0]);
        const den = parseFloat(fracParts[1]);
        if (den !== 0) return whole + (num / den);
      }
      return whole;
    }

    // Handle pure fraction e.g. "3/4"
    if (valStr.includes('/')) {
      const fracParts = valStr.split('/');
      const num = parseFloat(fracParts[0]);
      const den = parseFloat(fracParts[1]);
      if (den !== 0) return num / den;
    }

    return parseFloat(valStr);
  }

  // ==========================================================================
  // UNIFIED SEARCH & CATEGORY SELECTOR
  // ==========================================================================

  function renderCategoryDropdown() {
    if (!currentProject) return;
    const items = currentProject.items || [];

    // Tally item counts per category
    const catCounts = { ALL: items.length };
    items.forEach(item => {
      const cat = item.category || 'General';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // If current filter category no longer exists, reset to ALL
    if (currentFilterCategory !== 'ALL' && !catCounts[currentFilterCategory]) {
      currentFilterCategory = 'ALL';
    }

    el.searchCatLabel.textContent = currentFilterCategory === 'ALL' ? 'All' : currentFilterCategory;

    // Build Menu Items
    const categories = Object.keys(catCounts).filter(c => c !== 'ALL').sort();
    let menuHtml = `
      <div class="search-cat-item ${currentFilterCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
        <span class="search-cat-name">All Categories</span>
        <span class="search-cat-count">${catCounts.ALL || 0}</span>
      </div>
    `;

    categories.forEach(cat => {
      const isSelected = currentFilterCategory === cat;
      menuHtml += `
        <div class="search-cat-item ${isSelected ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
          <span class="search-cat-name">${escapeHtml(cat)}</span>
          <span class="search-cat-count">${catCounts[cat]}</span>
        </div>
      `;
    });

    el.searchCatMenu.innerHTML = menuHtml;

    // Attach click listeners to menu items
    el.searchCatMenu.querySelectorAll('.search-cat-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedCat = itemEl.dataset.cat;
        currentFilterCategory = selectedCat;
        closeCategoryDropdown();
        renderCategoryDropdown();
        renderMeasurementList();
      });
    });
  }

  function toggleCategoryDropdown(e) {
    e.stopPropagation();
    const isOpen = el.searchBoxUnified.classList.contains('dropdown-open');
    if (isOpen) {
      closeCategoryDropdown();
    } else {
      openCategoryDropdown();
    }
  }

  function openCategoryDropdown() {
    el.searchBoxUnified.classList.add('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCategoryDropdown() {
    el.searchBoxUnified.classList.remove('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'false');
  }

  // ==========================================================================
  // MEASUREMENT LIST & REORDERING
  // ==========================================================================

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
      const catClass = getCategoryColorClass(item.category);
      const categoryTag = item.category ? `<span class="card-cat-badge ${catClass}">${escapeHtml(item.category)}</span>` : '';
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
          <div class="card-reorder-group" data-stop-propagation>
            <button type="button" class="reorder-btn" data-action="move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button type="button" class="reorder-btn" data-action="move-down" title="Move Down" ${index === filtered.length - 1 ? 'disabled' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>

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

      card.addEventListener('click', (e) => {
        // Toggle check
        if (e.target.closest('[data-action="toggle-check"]')) {
          e.stopPropagation();
          toggleItemVerified(item.id);
          return;
        }

        // Move Up
        if (e.target.closest('[data-action="move-up"]')) {
          e.stopPropagation();
          moveItem(item.id, -1);
          return;
        }

        // Move Down
        if (e.target.closest('[data-action="move-down"]')) {
          e.stopPropagation();
          moveItem(item.id, 1);
          return;
        }

        openEditMeasurementModal(item);
      });

      el.measurementList.appendChild(card);
    });
  }

  function moveItem(itemId, delta) {
    if (!currentProject || !currentProject.items) return;
    const items = currentProject.items;
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;

    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    // Swap items
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderMeasurementList();
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

  function getCategoryColorClass(catName) {
    if (!catName) return 'cat-blue';
    const c = String(catName).toLowerCase();
    if (c.includes('wall') || c.includes('room') || c.includes('dim') || c.includes('interior')) return 'cat-blue';
    if (c.includes('wind') || c.includes('door') || c.includes('open') || c.includes('glass')) return 'cat-emerald';
    if (c.includes('top') || c.includes('leg') || c.includes('wood') || c.includes('assem') || c.includes('hard') || c.includes('shelf')) return 'cat-amber';
    if (c.includes('chest') || c.includes('body') || c.includes('tail') || c.includes('arm') || c.includes('shoul') || c.includes('torso')) return 'cat-purple';
    if (c.includes('box') || c.includes('freight') || c.includes('pack') || c.includes('weight') || c.includes('outer')) return 'cat-rose';

    const colors = ['cat-blue', 'cat-emerald', 'cat-amber', 'cat-purple', 'cat-rose'];
    let hash = 0;
    for (let i = 0; i < catName.length; i++) hash += catName.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  }

  // ==========================================================================
  // MEASUREMENT ACTIONS (Add / Edit / Multi-Dim / Delete)
  // ==========================================================================

  function setDimMode(mode) {
    activeDimMode = mode;
    document.querySelectorAll('.dim-mode-tab').forEach(tab => {
      const isActive = tab.dataset.dimMode === mode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (mode === '1d') {
      if (el.singleValueGrid) el.singleValueGrid.style.display = 'block';
      if (el.compositeInputsBox) el.compositeInputsBox.style.display = 'none';
      if (el.dimSectionTitle) {
        const titleSpan = el.dimSectionTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = 'Single Value';
      }
      if (!el.inputItemValue.value && el.inputDimL && el.inputDimL.value) {
        el.inputItemValue.value = el.inputDimL.value;
      }
    } else if (mode === '2d') {
      if (el.singleValueGrid) el.singleValueGrid.style.display = 'none';
      if (el.compositeInputsBox) el.compositeInputsBox.style.display = 'block';
      if (el.colDimH) el.colDimH.style.display = 'none';
      if (el.sepDimH) el.sepDimH.style.display = 'none';
      if (el.sepDimW) el.sepDimW.style.display = 'flex';
      if (el.dimSectionTitle) {
        const titleSpan = el.dimSectionTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = '2D Dimensions';
      }
      if (!el.inputDimL.value && el.inputItemValue && el.inputItemValue.value) {
        el.inputDimL.value = el.inputItemValue.value;
      }
      updateCompositeCalc();
    } else if (mode === '3d') {
      if (el.singleValueGrid) el.singleValueGrid.style.display = 'none';
      if (el.compositeInputsBox) el.compositeInputsBox.style.display = 'block';
      if (el.colDimH) el.colDimH.style.display = 'flex';
      if (el.sepDimH) el.sepDimH.style.display = 'flex';
      if (el.sepDimW) el.sepDimW.style.display = 'flex';
      if (el.dimSectionTitle) {
        const titleSpan = el.dimSectionTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = '3D Dimensions';
      }
      if (!el.inputDimL.value && el.inputItemValue && el.inputItemValue.value) {
        el.inputDimL.value = el.inputItemValue.value;
      }
      updateCompositeCalc();
    }
  }

  function updateCompositeCalc() {
    const l = parseFractionOrDecimal(el.inputDimL ? el.inputDimL.value : '') || 0;
    const w = parseFractionOrDecimal(el.inputDimW ? el.inputDimW.value : '') || 0;
    const h = parseFractionOrDecimal(el.inputDimH ? el.inputDimH.value : '') || 0;
    const unit = (el.selectItemUnit && el.selectItemUnit.value) ? el.selectItemUnit.value : 'cm';

    if (!el.compositeCalcBadge) return;

    if (activeDimMode === '2d') {
      if (l > 0 && w > 0) {
        const area = (l * w).toFixed(2).replace(/\.00$/, '');
        el.compositeCalcBadge.textContent = `📐 Area: ${area} ${unit}²`;
        el.compositeCalcBadge.style.display = 'block';
      } else {
        el.compositeCalcBadge.style.display = 'none';
      }
    } else if (activeDimMode === '3d') {
      if (l > 0 && w > 0 && h > 0) {
        const vol = (l * w * h).toFixed(2).replace(/\.00$/, '');
        const area = (l * w).toFixed(2).replace(/\.00$/, '');
        el.compositeCalcBadge.textContent = `📦 Vol: ${vol} ${unit}³ • Area: ${area} ${unit}²`;
        el.compositeCalcBadge.style.display = 'block';
      } else if (l > 0 && w > 0) {
        const area = (l * w).toFixed(2).replace(/\.00$/, '');
        el.compositeCalcBadge.textContent = `📐 Base Area: ${area} ${unit}²`;
        el.compositeCalcBadge.style.display = 'block';
      } else {
        el.compositeCalcBadge.style.display = 'none';
      }
    } else {
      el.compositeCalcBadge.style.display = 'none';
    }
  }

  function openAddMeasurementModal() {
    activeEditingItemId = null;
    el.measurementModalTitle.querySelector('span').textContent = 'Add Measurement';
    el.btnDeleteMeasurement.style.display = 'none';
    el.btnSaveAndNext.style.display = 'inline-flex';

    // Reset inputs
    el.inputItemLabel.value = '';
    el.inputItemValue.value = '';
    el.inputDimL.value = '';
    el.inputDimW.value = '';
    el.inputDimH.value = '';
    el.inputItemNotes.value = '';
    el.checkVerified.checked = false;
    setDimMode('1d');

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
    el.selectItemUnit.value = item.unit || 'cm';
    el.inputItemCategory.value = item.category || '';
    el.inputItemNotes.value = item.notes || '';
    el.checkVerified.checked = !!item.verified;

    // Detect if value is composite 2D or 3D
    const val = String(item.value || '').trim();
    if (val.includes('×') || val.includes('x') || val.includes('X')) {
      const parts = val.split(/[×xX]/).map(s => s.trim());
      if (parts.length >= 3) {
        setDimMode('3d');
        el.inputDimL.value = parts[0] || '';
        el.inputDimW.value = parts[1] || '';
        el.inputDimH.value = parts[2] || '';
      } else {
        setDimMode('2d');
        el.inputDimL.value = parts[0] || '';
        el.inputDimW.value = parts[1] || '';
        el.inputDimH.value = '';
      }
      updateCompositeCalc();
    } else {
      setDimMode('1d');
      el.inputItemValue.value = val;
    }

    openPopup(el.popupMeasurement);
  }

  function saveCurrentMeasurement(andNext = false) {
    const label = el.inputItemLabel.value.trim();
    let value = '';

    if (activeDimMode === '1d') {
      value = el.inputItemValue.value.trim();
    } else if (activeDimMode === '2d') {
      const l = el.inputDimL.value.trim();
      const w = el.inputDimW.value.trim();
      if (!l || !w) {
        showToast('⚠️ Please enter Length and Width');
        return;
      }
      value = `${l} × ${w}`;
    } else if (activeDimMode === '3d') {
      const l = el.inputDimL.value.trim();
      const w = el.inputDimW.value.trim();
      const h = el.inputDimH.value.trim();
      if (!l || !w || !h) {
        showToast('⚠️ Please enter Length, Width, and Height');
        return;
      }
      value = `${l} × ${w} × ${h}`;
    }

    const unit = el.selectItemUnit.value;
    const category = el.inputItemCategory.value.trim() || 'General';
    let notes = el.inputItemNotes.value.trim();
    const verified = el.checkVerified.checked;

    if (!label) {
      showToast('⚠️ Please enter a dimension or item label');
      el.inputItemLabel.focus();
      return;
    }

    if (!value) {
      showToast('⚠️ Please enter a measurement value');
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
        el.inputItemLabel.value = '';
        el.inputItemValue.value = '';
        el.inputDimL.value = '';
        el.inputDimW.value = '';
        el.inputDimH.value = '';
        el.inputItemNotes.value = '';
        el.checkVerified.checked = false;
        if (el.compositeCalcBadge) el.compositeCalcBadge.style.display = 'none';
        el.inputItemLabel.focus();
      } else {
        closePopup(el.popupMeasurement);
      }
    }
  }

  function deleteCurrentMeasurement() {
    if (!activeEditingItemId || !currentProject) return;
    const origIdx = currentProject.items.findIndex(i => i.id === activeEditingItemId);
    if (origIdx === -1) return;

    const itemToDelete = currentProject.items[origIdx];
    lastDeletedItem = {
      item: JSON.parse(JSON.stringify(itemToDelete)),
      index: origIdx,
      projectId: currentProject.id
    };

    currentProject.items.splice(origIdx, 1);
    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderAll();
    closePopup(el.popupMeasurement);

    showToast('Measurement deleted', 4500, {
      actionText: 'Undo',
      onAction: restoreDeletedItem
    });
  }

  function restoreDeletedItem() {
    if (!lastDeletedItem || !currentProject || lastDeletedItem.projectId !== currentProject.id) return;
    const targetIdx = Math.min(lastDeletedItem.index, currentProject.items.length);
    currentProject.items.splice(targetIdx, 0, lastDeletedItem.item);
    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderAll();
    showToast('✓ Measurement restored');
    lastDeletedItem = null;
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
    const countBadge = document.getElementById('sheetsCountBadge');
    if (countBadge) {
      countBadge.textContent = projects.length;
    }

    if (projects.length === 0) {
      el.projectListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 0.82rem;">
          No sheets yet. Create your first sheet above!
        </div>
      `;
      return;
    }

    projects.forEach(proj => {
      const isCurrent = currentProject && (proj.id === currentProject.id);
      const card = document.createElement('div');
      card.className = `project-item-card ${isCurrent ? 'active' : ''}`;
      
      const itemCount = (proj.items || []).length;
      const dateStr = proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : 'Recent';

      card.innerHTML = `
        <div class="project-card-info">
          <div class="project-card-title-row">
            <span class="project-card-title">${escapeHtml(proj.title)}</span>
            ${isCurrent ? '<span class="active-sheet-badge">✓ Active</span>' : ''}
          </div>
          <div class="project-card-meta">
            <span class="project-meta-pill">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
            <span class="project-meta-dot">&bull;</span>
            <span>${escapeHtml(proj.category || 'General')}</span>
            <span class="project-meta-dot">&bull;</span>
            <span>${dateStr}</span>
          </div>
        </div>
        <div class="project-card-actions">
          <button type="button" class="proj-action-btn" data-action="duplicate" title="Duplicate Sheet" aria-label="Duplicate Sheet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          ${projects.length > 1 ? `
          <button type="button" class="proj-action-btn delete" data-action="delete" title="Delete Sheet" aria-label="Delete Sheet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>` : ''}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="duplicate"]')) {
          e.stopPropagation();
          duplicateProject(proj.id);
          return;
        }
        if (e.target.closest('[data-action="delete"]')) {
          e.stopPropagation();
          deleteProject(proj.id);
          return;
        }
        switchActiveProject(proj.id);
      });

      el.projectListContainer.appendChild(card);
    });
  }

  function switchActiveProject(projectId) {
    const found = projects.find(p => p.id === projectId);
    if (found) {
      currentProject = found;
      currentFilterCategory = 'ALL';
      searchQuery = '';
      el.searchInput.value = '';
      saveData();
      renderAll();
      closePopup(el.popupProjects);
      showToast(`Switched to: ${currentProject.title}`);
    }
  }

  function createNewProject(title) {
    const newProj = {
      id: 'proj_' + Date.now().toString(36),
      title: title || 'New Measurement Sheet',
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
    el.searchInput.value = '';
    saveData();
    renderAll();
    showToast(`✓ Created sheet: ${newProj.title}`);
  }

  function duplicateProject(projectId) {
    const orig = projects.find(p => p.id === projectId);
    if (!orig) return;

    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'proj_' + Date.now().toString(36);
    copy.title = `${orig.title} (Copy)`;
    copy.updatedAt = new Date().toISOString();

    projects.unshift(copy);
    saveData();
    renderProjectList();
    showToast(`Duplicated sheet: ${copy.title}`);
  }

  function deleteProject(projectId) {
    if (projects.length <= 1) {
      showToast('⚠️ Cannot delete the only project sheet');
      return;
    }
    const proj = projects.find(p => p.id === projectId);
    if (!confirm(`Delete project "${proj ? proj.title : 'sheet'}"? This cannot be undone.`)) {
      return;
    }

    projects = projects.filter(p => p.id !== projectId);
    if (currentProject && currentProject.id === projectId) {
      currentProject = projects[0];
    }
    saveData();
    renderAll();
    renderProjectList();
    showToast('Project deleted');
  }

  // ==========================================================================
  // SKETCH PAD (Modal)
  // ==========================================================================

  function initSketchPad() {
    sketchPad = new window.SketchPad('sketchCanvas');

    // Tool Buttons
    const tools = [
      { btn: el.toolPen, name: 'pen' },
      { btn: el.toolLine, name: 'line' },
      { btn: el.toolArrow, name: 'arrow' },
      { btn: el.toolRect, name: 'rect' },
      { btn: el.toolText, name: 'text' },
      { btn: el.toolEraser, name: 'eraser' }
    ];

    tools.forEach(t => {
      if (!t.btn) return;
      t.btn.addEventListener('click', () => {
        tools.forEach(o => o.btn && o.btn.classList.remove('active'));
        t.btn.classList.add('active');
        sketchPad.tool = t.name;
      });
    });

    // Photo Backdrop Upload
    if (el.btnSketchPhoto && el.sketchPhotoInput) {
      el.btnSketchPhoto.addEventListener('click', () => el.sketchPhotoInput.click());
      el.sketchPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          sketchPad.loadPhoto(file, () => {
            showToast('✓ Photo loaded into canvas');
          });
        }
        e.target.value = '';
      });
    }

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
    }, 120);
  }

  // ==========================================================================
  // PDF, CSV & SHARE SHEET (Modal)
  // ==========================================================================

  function openPdfModal() {
    if (!currentProject) return;
    el.pdfTitleInput.value = currentProject.title ? `MEASUREMENT SHEET: ${currentProject.title.toUpperCase()}` : 'MEASUREMENT SPECIFICATION SHEET';
    el.pdfClientInput.value = currentProject.client || '';
    updatePdfPreview();
    openPopup(el.popupPdf);
  }

  function getPdfExportOptions() {
    return {
      title: el.pdfTitleInput.value || 'MEASUREMENT SHEET',
      client: el.pdfClientInput.value || 'General',
      includeSketch: el.pdfIncludeSketch.checked,
      includeSignature: el.pdfIncludeSign.checked,
      companyName: companyBranding.name || '',
      companyContact: companyBranding.contact || '',
      companyLogo: companyBranding.logo || null
    };
  }

  function updatePdfPreview() {
    if (!currentProject) return;
    saveBranding();
    const items = currentProject.items || [];
    const options = getPdfExportOptions();

    // Render into preview container
    el.pdfLivePreview.innerHTML = window.PDFGenerator.renderPrintDOM(
      currentProject,
      items,
      currentProject.sketchData,
      options
    );

    // Populate hidden #print-page-layout for native @media print
    el.printPageLayout.innerHTML = window.PDFGenerator.renderPrintDOM(
      currentProject,
      items,
      currentProject.sketchData,
      options
    );
  }

  function executePrint() {
    updatePdfPreview();
    window.print();
  }

  function downloadPdfFile() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    const options = getPdfExportOptions();
    window.PDFGenerator.downloadPDF(currentProject, items, options);
    showToast('✓ PDF download started');
  }

  function downloadCsvFile() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    window.PDFGenerator.downloadCSV(currentProject, items);
    showToast('✓ CSV cut-list downloaded');
  }

  async function executeShareSheet() {
    if (!currentProject) return;
    updatePdfPreview();
    const items = currentProject.items || [];
    const options = getPdfExportOptions();
    const pdfBlob = window.PDFGenerator.generatePDFBlob(currentProject, items, options);
    const textSummary = generateTextSummary(currentProject);
    const cleanTitle = (currentProject.title || 'Measurement_Sheet').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanTitle}.pdf`;

    if (navigator.share) {
      try {
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: currentProject.title,
            text: textSummary,
            files: [pdfFile]
          });
          showToast('✓ Shared via system sheet');
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('File share failed, falling back to text share:', err);
      }

      try {
        await navigator.share({
          title: currentProject.title,
          text: textSummary
        });
        showToast('✓ Shared text summary');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Desktop or non-share fallback
    copyTextSummary();
    window.PDFGenerator.downloadPDF(currentProject, items, options);
  }

  function generateTextSummary(proj) {
    const items = proj.items || [];
    let text = `📐 ${proj.title.toUpperCase()}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (proj.client) text += `Client: ${proj.client}\n`;
    if (companyBranding.name) text += `Contractor: ${companyBranding.name}\n`;
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
    return text;
  }

  function copyTextSummary() {
    if (!currentProject) return;
    const text = generateTextSummary(currentProject);

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
  // TEMPLATES (Starter Presets & Custom User Templates)
  // ==========================================================================

  function openTemplatesModal() {
    renderCustomTemplates();
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

  function applyCustomTemplate(tmpl) {
    if (!tmpl || !currentProject) return;
    const append = el.checkAppendTemplate.checked;
    if (!append) {
      if (currentProject.items.length > 0 && !confirm(`Replace existing measurements with template "${tmpl.title}"?`)) {
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
    showToast(`✓ Applied custom template: ${tmpl.title}`);
  }

  function saveCurrentSheetAsTemplate() {
    if (!currentProject || !currentProject.items || currentProject.items.length === 0) {
      showToast('⚠️ Current sheet has no measurements to save as template');
      return;
    }

    const defaultName = currentProject.title ? `${currentProject.title} Template` : 'Custom Template';
    const name = window.prompt('Enter a name for this custom template:', defaultName);
    if (!name || !name.trim()) return;

    const newTemplate = {
      id: 'cust_' + Date.now().toString(36),
      title: name.trim(),
      category: currentProject.category || 'Custom',
      items: currentProject.items.map(i => ({
        label: i.label,
        value: '', // Blank value for fresh filling
        unit: i.unit,
        category: i.category,
        notes: i.notes
      }))
    };

    customTemplates.unshift(newTemplate);
    saveCustomTemplates();
    showToast(`✓ Saved custom template: ${newTemplate.title}`);
  }

  function renderCustomTemplates() {
    if (!el.customTemplatesContainer) return;
    el.customTemplatesContainer.innerHTML = '';

    if (customTemplates.length === 0) {
      el.customTemplatesContainer.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); padding: 10px 12px; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color); text-align: center;">
          No custom templates saved yet. Tap "+ Save Current Sheet" above to save your recurring setups.
        </div>
      `;
      return;
    }

    customTemplates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'custom-template-card';
      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(tmpl.title)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            ${tmpl.items.length} items &bull; ${escapeHtml(tmpl.category || 'Custom')}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn btn-secondary" data-action="apply-custom" style="font-size: 0.74rem; padding: 4px 10px;">
            Apply
          </button>
          <button type="button" class="custom-template-del-btn" data-action="delete-custom" title="Delete template">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      card.querySelector('[data-action="apply-custom"]').addEventListener('click', (e) => {
        e.stopPropagation();
        applyCustomTemplate(tmpl);
      });

      card.querySelector('[data-action="delete-custom"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete template "${tmpl.title}"?`)) {
          customTemplates = customTemplates.filter(t => t.id !== tmpl.id);
          saveCustomTemplates();
          showToast('Template deleted');
        }
      });

      card.addEventListener('click', () => applyCustomTemplate(tmpl));
      el.customTemplatesContainer.appendChild(card);
    });
  }

  // ==========================================================================
  // UNIT CONVERTER & PROJECT-WIDE CONVERSION (Modal)
  // ==========================================================================

  function initConverter() {
    const convert = () => {
      const val = parseFloat(el.convFromVal.value) || 0;
      const from = el.convFromUnit.value;
      const to = el.convToUnit.value;

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

      if (to === 'in') {
        const whole = Math.floor(rounded);
        const frac = rounded - whole;
        const sixteenths = Math.round(frac * 16);
        if (sixteenths === 0) {
          el.fractionResult.textContent = `Exact: ${whole}"`;
        } else if (sixteenths === 16) {
          el.fractionResult.textContent = `Exact: ${whole + 1}"`;
        } else {
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

    if (el.btnBatchConvertUnits) {
      el.btnBatchConvertUnits.addEventListener('click', () => {
        const targetUnit = el.selectBatchTargetUnit.value;
        batchConvertProjectUnits(targetUnit);
      });
    }

    convert();
    calculateGeometry();
  }

  function batchConvertProjectUnits(targetUnit) {
    if (!currentProject || !currentProject.items || currentProject.items.length === 0) {
      showToast('⚠️ Current sheet has no measurements to convert');
      return;
    }

    const toMeters = {
      mm: 0.001,
      cm: 0.01,
      m: 1.0,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144
    };

    const convertValuePart = (valStr, fromUnit, toUnit) => {
      if (fromUnit === toUnit) return valStr;

      if (valStr.includes('×') || valStr.includes('x') || valStr.includes('X')) {
        return valStr.split(/[×xX]/)
          .map(part => convertValuePart(part.trim(), fromUnit, toUnit))
          .join(' × ');
      }

      const num = parseFractionOrDecimal(valStr);
      if (isNaN(num) || num === 0) return valStr;

      const meters = num * (toMeters[fromUnit] || 0.01);
      const converted = meters / (toMeters[toUnit] || 0.01);

      if (toUnit === 'mm') return String(Math.round(converted));
      if (toUnit === 'cm') return String(Math.round(converted * 10) / 10);
      if (toUnit === 'm') return String(Math.round(converted * 1000) / 1000);
      if (toUnit === 'in' || toUnit === 'ft' || toUnit === 'yd') return String(Math.round(converted * 100) / 100);
      return String(Math.round(converted * 100) / 100);
    };

    let convertedCount = 0;
    currentProject.items.forEach(item => {
      const from = (item.unit || 'cm').toLowerCase();
      item.value = convertValuePart(item.value, from, targetUnit);
      item.unit = targetUnit;
      convertedCount++;
    });

    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderAll();
    closePopup(el.popupConverter);
    showToast(`✓ Converted ${convertedCount} items to ${targetUnit}`);
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================

  function bindGlobalListeners() {
    // Popup triggers
    el.btnOpenAddMeasurement.addEventListener('click', openAddMeasurementModal);
    el.btnEmptyAdd.addEventListener('click', openAddMeasurementModal);
    
    el.btnOpenProjects.addEventListener('click', openProjectsModal);
    if (el.btnOpenSketch) {
      el.btnOpenSketch.addEventListener('click', openSketchModal);
    }
    el.btnBottomSketch.addEventListener('click', openSketchModal);
    
    el.btnOpenTemplates.addEventListener('click', openTemplatesModal);
    el.btnEmptyTemplate.addEventListener('click', openTemplatesModal);
    
    el.btnOpenConverter.addEventListener('click', () => openPopup(el.popupConverter));
    
    if (el.btnOpenPdf) {
      el.btnOpenPdf.addEventListener('click', openPdfModal);
    }
    el.btnBottomPdf.addEventListener('click', openPdfModal);

    // Dimension Mode Tabs (1D, 2D, 3D)
    if (el.dimModeTabs) {
      el.dimModeTabs.querySelectorAll('.dim-mode-tab').forEach(tab => {
        tab.addEventListener('click', () => setDimMode(tab.dataset.dimMode));
      });
    }

    // Composite inputs calculations & unit change
    if (el.inputDimL) el.inputDimL.addEventListener('input', updateCompositeCalc);
    if (el.inputDimW) el.inputDimW.addEventListener('input', updateCompositeCalc);
    if (el.inputDimH) el.inputDimH.addEventListener('input', updateCompositeCalc);
    if (el.selectItemUnit) el.selectItemUnit.addEventListener('change', updateCompositeCalc);

    // Save current sheet as custom template
    if (el.btnSaveSheetAsTemplate) {
      el.btnSaveSheetAsTemplate.addEventListener('click', saveCurrentSheetAsTemplate);
    }

    // Company Logo Upload
    if (el.pdfLogoInput) {
      el.pdfLogoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            companyBranding.logo = ev.target.result;
            renderLogoPreview();
            saveBranding();
            updatePdfPreview();
            showToast('✓ Logo uploaded');
          };
          reader.readAsDataURL(file);
        }
        e.target.value = '';
      });
    }

    if (el.btnClearLogo) {
      el.btnClearLogo.addEventListener('click', () => {
        companyBranding.logo = null;
        renderLogoPreview();
        saveBranding();
        updatePdfPreview();
        showToast('Logo removed');
      });
    }

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
    document.addEventListener('click', (e) => {
      if (!el.searchBoxUnified.contains(e.target)) {
        closeCategoryDropdown();
      }
    });

    // Search query input
    el.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      el.btnClearSearch.classList.toggle('visible', searchQuery.length > 0);
      renderMeasurementList();
    });

    el.btnClearSearch.addEventListener('click', () => {
      searchQuery = '';
      el.searchInput.value = '';
      el.btnClearSearch.classList.remove('visible');
      renderMeasurementList();
    });

    // Measurement save buttons
    el.btnSaveMeasurement.addEventListener('click', () => saveCurrentMeasurement(false));
    el.btnSaveAndNext.addEventListener('click', () => saveCurrentMeasurement(true));
    el.btnDeleteMeasurement.addEventListener('click', deleteCurrentMeasurement);

    // Label quick suggestion chips
    el.labelSuggestions.querySelectorAll('.sugg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.inputItemLabel.value = chip.dataset.label;
        if (activeDimMode === '1d') {
          el.inputItemValue.focus();
        } else {
          el.inputDimL.focus();
        }
      });
    });

    // Track active/focused input among 1D, L, W, H for helpers & keyboard
    let lastActiveDimInput = el.inputItemValue;
    [el.inputItemValue, el.inputDimL, el.inputDimW, el.inputDimH].forEach(inputEl => {
      if (!inputEl) return;
      inputEl.addEventListener('focus', () => {
        lastActiveDimInput = inputEl;
      });
    });

    // Quick numeric increment / fraction buttons (shared across 1D, 2D, 3D)
    document.querySelectorAll('.quick-value-helpers button').forEach(btn => {
      btn.addEventListener('click', () => {
        const inc = btn.dataset.inc;
        const frac = btn.dataset.frac;
        const target = (activeDimMode === '1d') ? el.inputItemValue : (lastActiveDimInput || el.inputDimL);
        if (!target) return;
        const current = target.value.trim();

        if (frac) {
          target.value = current ? `${current.replace(/\s*[¼½¾\d\/]+$/, '')}${frac}`.trim() : frac.trim();
        } else if (inc) {
          const delta = parseFloat(inc) || 0;
          const val = parseFractionOrDecimal(current);
          const base = isNaN(val) ? 0 : val;
          const next = Math.max(0, Math.round((base + delta) * 10) / 10);
          target.value = next;
        }

        if (activeDimMode !== '1d') {
          updateCompositeCalc();
        }
      });
    });

    // Keyboard enter navigation for 1D, 2D, 3D inputs
    if (el.inputItemValue) {
      el.inputItemValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.btnSaveMeasurement.click();
        }
      });
    }

    if (el.inputDimL) {
      el.inputDimL.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (el.inputDimW) el.inputDimW.focus();
        }
      });
    }

    if (el.inputDimW) {
      el.inputDimW.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (activeDimMode === '3d' && el.inputDimH) {
            el.inputDimH.focus();
          } else {
            el.btnSaveMeasurement.click();
          }
        }
      });
    }

    if (el.inputDimH) {
      el.inputDimH.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.btnSaveMeasurement.click();
        }
      });
    }

    // Projects modal action
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

    el.inputNewProjectName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.btnCreateProject.click();
      }
    });

    // Templates selection (starter presets)
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.template;
        applyTemplate(key);
      });
    });

    // PDF options & branding changes
    el.pdfTitleInput.addEventListener('input', updatePdfPreview);
    el.pdfClientInput.addEventListener('input', updatePdfPreview);
    if (el.pdfCompanyInput) el.pdfCompanyInput.addEventListener('input', updatePdfPreview);
    if (el.pdfContactInput) el.pdfContactInput.addEventListener('input', updatePdfPreview);
    el.pdfIncludeSketch.addEventListener('change', updatePdfPreview);
    el.pdfIncludeSign.addEventListener('change', updatePdfPreview);

    // Share & export actions
    if (el.btnShareSheet) el.btnShareSheet.addEventListener('click', executeShareSheet);
    el.btnExecutePrint.addEventListener('click', executePrint);
    el.btnDownloadPdf.addEventListener('click', downloadPdfFile);
    if (el.btnDownloadCsv) el.btnDownloadCsv.addEventListener('click', downloadCsvFile);
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
    const data = {
      projects,
      customTemplates,
      companyBranding,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
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
          // Legacy format: array of projects
          projects = imported;
          currentProject = projects[0] || null;
        } else if (imported && Array.isArray(imported.projects)) {
          // New format
          projects = imported.projects;
          currentProject = projects[0] || null;
          if (Array.isArray(imported.customTemplates)) {
            customTemplates = imported.customTemplates;
            saveCustomTemplates();
          }
          if (imported.companyBranding) {
            companyBranding = imported.companyBranding;
            saveBranding();
          }
        } else {
          showToast('⚠️ Invalid backup file format');
          return;
        }

        saveData();
        renderAll();
        renderProjectList();
        showToast('✓ Backup restored successfully');
      } catch (err) {
        showToast('⚠️ Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS (With Undo Support)
  // ==========================================================================

  function showToast(message, duration = 2400, action = null) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    if (action && action.actionText && action.onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = action.actionText;
      actionBtn.addEventListener('click', () => {
        action.onAction();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

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
