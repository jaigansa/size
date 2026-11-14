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

  // Standard Default Category List
  const DEFAULT_CATEGORIES = [
    'General',
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Bathroom',
    'Windows & Doors',
    'Cabinetry',
    'Framing',
    'Hardware',
    'Electrical',
    'Plumbing',
    'Exterior'
  ];

  // --- State ---
  let projects = [];
  let currentProject = null;
  let activeEditingItemId = null;
  let currentFilterCategory = 'ALL';
  let searchQuery = '';
  let sketchPad = null;
  let lastDeletedItem = null;
  let activeDimMode = '1d'; // '1d', '2d', '3d'
  let lastActiveDimInput = null;
  let lastSelectedUnit = 'cm'; // tracks the unit before a selector change so values can be converted
  let customTemplates = [];
  let companyBranding = { name: '', contact: '', logo: null };

  // --- DOM Elements ---
  const el = {
    // Top Bar
    displayProjectTitle: document.getElementById('displayProjectTitle'),
    displayProjectCategory: document.getElementById('displayProjectCategory'),
    btnOpenProjects: document.getElementById('btnOpenProjects'),
    btnHeaderRenameSheet: document.getElementById('btnHeaderRenameSheet'),
    btnOpenTheme: document.getElementById('btnOpenTheme'),
    btnOpenSketch: document.getElementById('btnOpenSketch'),
    btnOpenTemplates: document.getElementById('btnOpenTemplates'),
    btnOpenConverter: document.getElementById('btnOpenConverter'),
    btnOpenPdf: document.getElementById('btnOpenPdf'),
    sketchBadgeDot: document.getElementById('sketchBadgeDot'),
    
    // Stats
    statItemCount: document.getElementById('statItemCount'),
    statMainUnit: document.getElementById('statMainUnit'),
    statUnitCount: document.getElementById('statUnitCount'),
    statTotalSum: document.getElementById('statTotalSum'),
    statGroupCount: document.getElementById('statGroupCount'),

    // Search & Category Dropdown
    searchFilterBar: document.querySelector('.search-filter-bar'),
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
    dimKbdSegmented: document.getElementById('dimKbdSegmented'),
    dimKbdChip123: document.getElementById('dimKbdChip123'),
    dimKbdChipFx: document.getElementById('dimKbdChipFx'),
    compositeCalcBadge: document.getElementById('compositeCalcBadge'),
    btnEvalCadExpr: document.getElementById('btnEvalCadExpr'),
    singleValueGrid: document.getElementById('singleValueGrid'),
    inputItemLabel: document.getElementById('inputItemLabel'),
    inputItemValue: document.getElementById('inputItemValue'),
    inputItemUnitBadge: document.getElementById('inputItemUnitBadge'),
    selectItemUnit: document.getElementById('selectItemUnit'),
    unitSelectDisplay: document.getElementById('unitSelectDisplay'),
    inputItemCategory: document.getElementById('inputItemCategory'),
    inputItemNotes: document.getElementById('inputItemNotes'),
    checkVerified: document.getElementById('checkVerified'),
    verifiedCheckboxCard: document.getElementById('verifiedCheckboxCard'),
    verifiedStatusPill: document.getElementById('verifiedStatusPill'),
    btnSaveMeasurement: document.getElementById('btnSaveMeasurement'),
    btnSaveAndNext: document.getElementById('btnSaveAndNext'),
    btnDeleteMeasurement: document.getElementById('btnDeleteMeasurement'),
    labelSuggestions: document.getElementById('labelSuggestions'),
    categorySuggestions: document.getElementById('categorySuggestions'),
    categoryList: document.getElementById('categoryList'),

    // Projects Modal
    popupProjects: document.getElementById('popupProjects'),
    projectListContainer: document.getElementById('projectListContainer'),
    inputNewProjectName: document.getElementById('inputNewProjectName'),
    btnCreateProject: document.getElementById('btnCreateProject'),
    btnExportData: document.getElementById('btnExportData'),
    importFileInput: document.getElementById('importFileInput'),
    importCsvInput: document.getElementById('importCsvInput'),
    importCsvInputTemplate: document.getElementById('importCsvInputTemplate'),
    importCsvInputTemplateFooter: document.getElementById('importCsvInputTemplateFooter'),
    importCsvInputEmpty: document.getElementById('importCsvInputEmpty'),

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
    pdfIncludeArea: document.getElementById('pdfIncludeArea'),
    pdfIncludeVolume: document.getElementById('pdfIncludeVolume'),
    pdfIncludeCategories: document.getElementById('pdfIncludeCategories'),
    pdfIncludeNotes: document.getElementById('pdfIncludeNotes'),
    pdfCommonUnit: document.getElementById('pdfCommonUnit'),
    pdfAreaUnitFormat: document.getElementById('pdfAreaUnitFormat'),
    pdfOnlyVerified: document.getElementById('pdfOnlyVerified'),
    chipPdfOnlyVerified: document.getElementById('chipPdfOnlyVerified'),
    pdfVerifiedBadge: document.getElementById('pdfVerifiedBadge'),
    brandingDetails: document.getElementById('brandingDetails'),
    pdfLivePreview: document.getElementById('pdfLivePreview'),
    btnShareSheet: document.getElementById('btnShareSheet'),
    btnExecutePrint: document.getElementById('btnExecutePrint'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),
    btnDownloadCsv: document.getElementById('btnDownloadCsv'),
    btnCopyTextSummary: document.getElementById('btnCopyTextSummary'),

    // Templates Modal
    popupTemplates: document.getElementById('popupTemplates'),
    checkAppendTemplate: document.getElementById('checkAppendTemplate'),
    templateCheckboxCard: document.getElementById('templateCheckboxCard'),
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
    applyKbdMode(currentKbdMode, false);
    updateVerifiedCheckboxUI();
    updateTemplateAppendCheckboxUI();
    syncAllCheckboxChips();
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
    closeDimUnitDropdown();
  }

  function closeAllPopups() {
    document.querySelectorAll('.popup-overlay').forEach(p => p.classList.remove('active'));
    document.body.style.overflow = '';
    closeDimUnitDropdown();
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
    if (el.statItemCount) el.statItemCount.textContent = totalCount;

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
    if (el.statMainUnit) el.statMainUnit.textContent = mainUnit;
    if (el.statUnitCount) el.statUnitCount.textContent = `${distinctUnits} unit${distinctUnits === 1 ? '' : 's'}`;

    // Sum of primary unit items
    let sum = 0;
    let sumCount = 0;
    items.forEach(i => {
      if ((i.unit || '').toLowerCase() === mainUnit) {
        const val = parseFractionOrDecimal(i.value, mainUnit);
        if (!isNaN(val)) {
          sum += val;
          sumCount++;
        }
      }
    });

    if (el.statTotalSum) el.statTotalSum.textContent = sumCount > 0 ? (Math.round(sum * 100) / 100) : '0';
    const categories = new Set(items.map(i => i.category || 'General'));
    if (el.statGroupCount) el.statGroupCount.textContent = `${categories.size} group${categories.size === 1 ? '' : 's'}`;
  }

  function parseFractionOrDecimal(valStr, defaultUnit = 'in') {
    if (!valStr) return NaN;
    valStr = String(valStr).replace(/^[LWHlwh]\s*:\s*/i, '').trim();

    // Check CADParser first (handles architectural CAD expressions like 1' 5" + 1/4", 3' 6" - 2", fractions, etc.)
    if (window.CADParser) {
      let firstPart = valStr;
      if (valStr.includes('×') || /(?:\d|['"])\s*[xX]\s*(?:\d|['"])/.test(valStr) || (valStr.search(/\s+[xX]\s+/) !== -1)) {
        firstPart = valStr.split(/\s*[×xX]\s*/)[0].trim();
      }
      const cadNum = window.CADParser.evaluateToNumber(firstPart, defaultUnit);
      if (!isNaN(cadNum)) {
        return cadNum;
      }
    }

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
  // UNIT SWITCHING
  // ==========================================================================

  // Linear unit factors relative to one meter.
  const UNIT_TO_METERS = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    in: 0.0254,
    '"': 0.0254,
    ft: 0.3048,
    "'": 0.3048,
    yd: 0.9144
  };

  const UNIT_DECIMALS = { mm: 1, cm: 2, m: 4, in: 3, '"': 3, ft: 4, "'": 4, yd: 4 };

  const UNIT_LABELS = {
    mm: 'millimeters',
    cm: 'centimeters',
    m: 'meters',
    in: 'inches',
    ft: 'feet',
    yd: 'yards'
  };

  const UNIT_SYMBOLS = {
    mm: 'mm',
    cm: 'cm',
    m: 'm',
    in: 'in',
    ft: 'ft',
    yd: 'yd'
  };

  const UNIT_SHORT_LABELS = {
    mm: 'mm',
    cm: 'cm',
    m: 'm',
    in: 'in',
    ft: 'ft',
    yd: 'yd'
  };

  // Keep the compact pill label, unit dropdown, and inputItemValue unit badge in sync with the native select.
  function syncUnitDisplay() {
    if (!el.selectItemUnit) return;
    const unit = el.selectItemUnit.value;
    const symbol = UNIT_SYMBOLS[unit] || unit;
    if (el.unitSelectDisplay) el.unitSelectDisplay.textContent = symbol;
    if (el.inputItemUnitBadge) el.inputItemUnitBadge.textContent = symbol;

    const dimUnitMenu = document.getElementById('dimUnitMenu');
    if (dimUnitMenu) {
      dimUnitMenu.querySelectorAll('.dim-unit-menu-item').forEach(item => {
        const isActive = item.dataset.unit === unit;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }

    const dimUnitPill = document.getElementById('dimUnitPill');
    if (dimUnitPill) {
      dimUnitPill.querySelectorAll('.dim-unit-chip').forEach(chip => {
        const isActive = chip.dataset.unit === unit;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }
  }

  function closeDimUnitDropdown() {
    const dimUnitDropdown = document.getElementById('dimUnitDropdown');
    const dimUnitDropdownBtn = document.getElementById('dimUnitDropdownBtn');
    if (dimUnitDropdown) {
      dimUnitDropdown.classList.remove('open');
      if (dimUnitDropdownBtn) dimUnitDropdownBtn.setAttribute('aria-expanded', 'false');
    }
  }

  // ==========================================================================
  // QUICK KEYBOARD MODE CONTROLLER (123 ⟷ fx)
  // ==========================================================================
  const KBD_MODE_KEY = 'sizenotes_kbd_mode_v1';
  let currentKbdMode = '123';
  try {
    const saved = localStorage.getItem(KBD_MODE_KEY);
    if (saved === 'fx' || saved === '123') {
      currentKbdMode = saved;
    }
  } catch (e) {
    console.warn('LocalStorage unavailable for keyboard mode:', e);
  }

  function applyKbdMode(mode, refocus = true) {
    currentKbdMode = (mode === 'fx') ? 'fx' : '123';
    try {
      localStorage.setItem(KBD_MODE_KEY, currentKbdMode);
    } catch (e) {
      console.warn('Failed to save kbd mode:', e);
    }

    // Sync segmented toggle buttons
    const chips = document.querySelectorAll('.dim-kbd-chip');
    chips.forEach(chip => {
      const isCurrent = chip.dataset.mode === currentKbdMode;
      chip.classList.toggle('active', isCurrent);
      chip.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
    });

    // Update inputmode on dimension fields: decimal (123) or text (fx)
    const modeValue = (currentKbdMode === '123') ? 'decimal' : 'text';
    const targetInputs = [el.inputDimL, el.inputDimW, el.inputDimH, el.inputItemValue].filter(Boolean);
    targetInputs.forEach(input => {
      input.setAttribute('inputmode', modeValue);
    });

    // If modal is active and refocus requested, re-focus so mobile keyboards switch dynamically
    if (refocus && el.popupMeasurement && el.popupMeasurement.classList.contains('active')) {
      const target = (document.activeElement && targetInputs.includes(document.activeElement)) 
        ? document.activeElement 
        : (lastActiveDimInput || el.inputDimL);
      if (target && typeof target.focus === 'function') {
        try {
          target.blur();
          setTimeout(() => {
            target.focus();
            const len = target.value ? target.value.length : 0;
            if (target.setSelectionRange) {
              target.setSelectionRange(len, len);
            }
          }, 20);
        } catch (e) {}
      }
    }
  }

  // Detects if a dimension string contains a unit and returns the canonical unit: 'cm', 'mm', 'm', 'in', 'ft', 'yd'
  function detectUnitFromInputString(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim();
    if (!s) return null;

    // 1. Millimeters (check before meters)
    if (/(?:^|\d|\s)\s*mm\b/i.test(s) || /millimeter/i.test(s)) return 'mm';

    // 2. Centimeters
    if (/(?:^|\d|\s)\s*cm\b/i.test(s) || /centimeter/i.test(s)) return 'cm';

    // 3. Meters (not mm, not cm)
    if (/\d\s*m\b/i.test(s) && !/[cm]m\b/i.test(s)) return 'm';

    // 4. Inches: '"' or in / inch / inches
    if (s.includes('"') || /(?:\d|\s|^)\s*(?:in|inch|inches)\b/i.test(s)) return 'in';

    // 5. Feet: "'" or ft / feet / foot
    if (s.includes("'") || /(?:\d|\s|^)\s*(?:ft|feet|foot)\b/i.test(s)) return 'ft';

    // 6. Yards: yd / yard / yards
    if (/(?:\d|\s|^)\s*(?:yd|yard|yards)\b/i.test(s)) return 'yd';

    return null;
  }

  // Cleans redundant typed units matching the current unit so inputs display cleanly without duplication
  function stripRedundantUnit(str, unit) {
    if (!str || typeof str !== 'string') return str;
    const s = str.trim();
    if (!s) return s;

    // Do not alter composite expressions (e.g. 1' 5", math expressions like 10 + 5)
    if (/[+*]/.test(s)) return s;
    if (s.includes("'") && s.includes('"')) return s;

    if (unit === 'cm') return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*cm$/i, '$1');
    if (unit === 'mm') return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*mm$/i, '$1');
    if (unit === 'm') return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*m$/i, '$1');
    if (unit === 'in' || unit === '"') return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*(?:"|in|inch|inches)$/i, '$1');
    if (unit === 'ft' || unit === "'") return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*(?:'|ft|feet|foot)$/i, '$1');
    if (unit === 'yd') return s.replace(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*(?:yd|yard|yards)$/i, '$1');
    return s;
  }

  function convertBetweenUnits(value, fromUnit, toUnit) {
    if (!isFinite(value) || fromUnit === toUnit) return value;
    const from = UNIT_TO_METERS[fromUnit] || UNIT_TO_METERS.cm;
    const to = UNIT_TO_METERS[toUnit] || UNIT_TO_METERS.cm;
    return value * from / to;
  }

  function formatUnitValue(value, unit) {
    if (!isFinite(value)) return '';
    const decimals = UNIT_DECIMALS[unit];
    if (decimals === undefined) return String(value);
    const factor = Math.pow(10, decimals);
    return String(Math.round(value * factor) / factor);
  }

  // Like parseFractionOrDecimal(), but keeps the full precision of the parsed
  // CAD result instead of the 3-decimal "value" field. This avoids drift when
  // switching units back and forth.
  function parseValueInUnit(raw, unit) {
    const str = String(raw || '').trim();
    if (!str) return NaN;

    if (window.CADParser && window.CADParser.parse) {
      const res = window.CADParser.parse(str, unit);
      if (res && isFinite(res.inches)) {
        const factor = window.CADParser.fromInches[unit];
        return res.inches * (factor === undefined ? 1 : factor);
      }
    }

    return parseFractionOrDecimal(str, unit);
  }

  // Converts a single input string (plain, fraction, CAD expression or composite)
  // from one unit to another, preserving the composite "a × b" structure and directional prefixes.
  function convertInputValueString(raw, fromUnit, toUnit) {
    const str = String(raw || '').trim();
    if (!str) return str;

    if (str.includes('×') || /(?:\d|['"])\s*[xX]\s*(?:\d|['"])/.test(str) || str.search(/\s+[xX]\s+/) !== -1) {
      return str.split(/\s*[×xX]\s*/).map(part => {
        const m = part.trim().match(/^([LWHlwh]):\s*(.*)$/i);
        const prefix = m ? m[1].toUpperCase() + ': ' : '';
        const rawDim = m ? m[2] : part.trim();
        const num = parseValueInUnit(rawDim.trim(), fromUnit);
        if (isNaN(num)) return part.trim();
        return prefix + formatUnitValue(convertBetweenUnits(num, fromUnit, toUnit), toUnit);
      }).join(' × ');
    }

    const m = str.match(/^([LWHlwh]):\s*(.*)$/i);
    const prefix = m ? m[1].toUpperCase() + ': ' : '';
    const rawDim = m ? m[2] : str;
    const num = parseValueInUnit(rawDim.trim(), fromUnit);
    if (isNaN(num)) return str;
    return prefix + formatUnitValue(convertBetweenUnits(num, fromUnit, toUnit), toUnit);
  }

  // Convert the values already typed into the measurement form when the user
  // switches units, instead of silently relabeling them.
  function convertMeasurementInputs(fromUnit, toUnit) {
    if (!fromUnit || !toUnit || fromUnit === toUnit) return 0;

    const fields = [el.inputItemValue, el.inputDimL, el.inputDimW, el.inputDimH];
    let converted = 0;

    fields.forEach(field => {
      if (!field) return;
      const raw = (field.value || '').trim();
      if (!raw) return;
      const next = convertInputValueString(raw, fromUnit, toUnit);
      if (next !== raw) {
        field.value = next;
        converted++;
      }
    });

    return converted;
  }

  // ==========================================================================
  // UNIFIED SEARCH & CATEGORY SELECTOR
  // ==========================================================================

  function renderCategoryDropdown() {
    if (!currentProject) return;
    const items = currentProject.items || [];

    // Tally item counts per category actually present in the current sheet (no preset categories)
    const catCounts = { ALL: items.length };
    items.forEach(item => {
      const cat = (item.category && item.category.trim()) ? item.category.trim() : 'General';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // If current filter category no longer exists in available categories, reset to ALL
    if (currentFilterCategory !== 'ALL' && !(currentFilterCategory in catCounts)) {
      currentFilterCategory = 'ALL';
    }

    el.searchCatLabel.textContent = currentFilterCategory === 'ALL' ? 'All' : currentFilterCategory;
    el.searchCatBtn.classList.toggle('has-filter', currentFilterCategory !== 'ALL');

    // Build Menu Items
    const categories = Object.keys(catCounts).filter(c => c !== 'ALL').sort();
    let menuHtml = `
      <button type="button" class="cat-menu-item search-cat-item ${currentFilterCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
        <span class="cat-menu-name search-cat-name">All Categories</span>
        <span class="cat-menu-count search-cat-count">${catCounts.ALL || 0}</span>
      </button>
    `;

    categories.forEach(cat => {
      const isSelected = currentFilterCategory === cat;
      menuHtml += `
        <button type="button" class="cat-menu-item search-cat-item ${isSelected ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
          <span class="cat-menu-name search-cat-name">${escapeHtml(cat)}</span>
          <span class="cat-menu-count search-cat-count">${catCounts[cat]}</span>
        </button>
      `;
    });

    el.searchCatMenu.innerHTML = menuHtml;

    // Attach click listeners to menu items
    el.searchCatMenu.querySelectorAll('.cat-menu-item, .search-cat-item').forEach(itemEl => {
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isOpen = el.searchCatDropdown.classList.contains('open') || el.searchBoxUnified.classList.contains('dropdown-open');
    if (isOpen) {
      closeCategoryDropdown();
    } else {
      openCategoryDropdown();
    }
  }

  function openCategoryDropdown() {
    el.searchCatDropdown.classList.add('open');
    el.searchBoxUnified.classList.add('dropdown-open');
    if (el.searchFilterBar) el.searchFilterBar.classList.add('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCategoryDropdown() {
    el.searchCatDropdown.classList.remove('open');
    el.searchBoxUnified.classList.remove('dropdown-open');
    if (el.searchFilterBar) el.searchFilterBar.classList.remove('dropdown-open');
    el.searchCatBtn.setAttribute('aria-expanded', 'false');
  }

  // ==========================================================================
  // MEASUREMENT LIST & REORDERING
  // ==========================================================================

  function getFilteredItems() {
    if (!currentProject) return [];
    const items = currentProject.items || [];
    return items.filter(item => {
      const matchesCategory = (currentFilterCategory === 'ALL') ||
        ((item.category || 'General').toLowerCase() === currentFilterCategory.toLowerCase());

      if (!matchesCategory) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const labelMatch = (item.label || '').toLowerCase().includes(q);
      const catMatch = (item.category || '').toLowerCase().includes(q);
      const valMatch = (item.value || '').toLowerCase().includes(q);
      const noteMatch = (item.notes || '').toLowerCase().includes(q);
      return labelMatch || catMatch || valMatch || noteMatch;
    });
  }

  function cleanPartValueAndUnit(val, defaultUnit) {
    let str = String(val || '').trim();
    if (!str || str === '--') return { value: '--', unit: defaultUnit || '' };

    // If it's architectural notation like 1' 5" or 1'-5 1/4", the unit is self-contained
    if (str.includes("'") && (str.includes('"') || /\d+\/\d+/.test(str))) {
      return { value: str, unit: '' };
    }

    // Check for unit attached to the value (e.g. "10cm", "10 cm", "10in", "10\"")
    const unitMatch = str.match(/^(.*?)\s*(mm|cm|m|in|ft|yd|"|'|”|′)$/i);
    if (unitMatch && unitMatch[1]) {
      const numPart = unitMatch[1].trim();
      let detectedUnit = unitMatch[2].toLowerCase();
      if (detectedUnit === '"' || detectedUnit === '”') detectedUnit = 'in';
      if (detectedUnit === "'" || detectedUnit === '′') detectedUnit = 'ft';
      return { value: numPart, unit: detectedUnit || defaultUnit || '' };
    }

    return { value: str, unit: defaultUnit || '' };
  }

  function parseCardMeasurementParts(rawVal, defaultUnit, itemLabel) {
    if (!rawVal || rawVal.trim() === '') {
      return [{ prefix: 'L:', value: '--', unit: defaultUnit || '' }];
    }
    const str = rawVal.trim();
    if (/(^|\s)[LWHlwh]:/.test(str)) {
      const parts = str.split(/(?=\b[LWHlwh]:)/i).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1 || /^[LWHlwh]:/i.test(parts[0])) {
        return parts.map(p => {
          const m = p.match(/^([LWHlwh]):\s*(.*?)(mm|cm|m|in|ft|yd|"|'|”|′)?$/i);
          if (m) {
            let val = m[2].replace(/[×xX]\s*$/, '').trim() || '--';
            const unit = m[3] ? m[3].trim() : (defaultUnit || '');
            const cleaned = cleanPartValueAndUnit(val, unit);
            return { prefix: m[1].toUpperCase() + ':', value: cleaned.value, unit: cleaned.unit };
          }
          const cleaned = cleanPartValueAndUnit(p, defaultUnit);
          return { prefix: 'L:', value: cleaned.value, unit: cleaned.unit };
        });
      }
    }

    let splitParts = str.split(/\s*[×xX]\s*/);
    if (splitParts.length === 0 || (splitParts.length === 1 && !splitParts[0])) {
      splitParts = ['--'];
    }

    const defaultPrefixes = ['L:', 'W:', 'H:', 'D:'];
    if (splitParts.length === 1) {
      const lower = (itemLabel || '').toLowerCase();
      let pfx = 'L:';
      if (lower.includes('height') || lower.includes('thick') || lower.includes('depth') || lower.includes('rise')) {
        pfx = 'H:';
      } else if (lower.includes('width') || lower.includes('span') || lower.includes('opening') || lower.includes('clearance')) {
        pfx = 'W:';
      }
      let pVal = splitParts[0].replace(/^[LWHlwh]\s*:\s*/, '').trim() || '--';
      const cleaned = cleanPartValueAndUnit(pVal, defaultUnit);
      return [{ prefix: pfx, value: cleaned.value, unit: cleaned.unit }];
    }

    if (splitParts.length === 2) {
      const lower = (itemLabel || '').toLowerCase();
      const isWidthHeight = lower.includes('door') || lower.includes('window') || lower.includes('opening') || lower.includes('elevation') || (lower.includes('height') && lower.includes('width'));
      if (isWidthHeight) {
        defaultPrefixes[0] = 'W:';
        defaultPrefixes[1] = 'H:';
      }
    }

    return splitParts.map((p, idx) => {
      let pfx = defaultPrefixes[idx] || `D${idx + 1}:`;
      const pMatch = p.match(/^([LWHlwh]):\s*(.*)$/);
      if (pMatch) {
        pfx = pMatch[1].toUpperCase() + ':';
        p = pMatch[2];
      }
      let pVal = p.trim() || '--';
      const cleaned = cleanPartValueAndUnit(pVal, defaultUnit);
      return { prefix: pfx, value: cleaned.value, unit: cleaned.unit };
    });
  }

  // Formats a dimension value string for HTML display.
  // For imperial / inches (or any value with fractions), renders the fraction part
  // with a slightly lower (smaller) font size and subscript alignment (.dim-frac).
  function formatFractionValueHtml(valStr, unit) {
    if (!valStr || typeof valStr !== 'string') return '';
    const str = valStr.trim();
    if (str === '--' || str === '—') return escapeHtml(str);

    const escaped = escapeHtml(str);

    // Matches standard slash fractions e.g. "1/2", "3/4", "15/16", "3/32"
    // or Unicode vulgar fractions e.g. ½, ¼, ¾, ⅛, ⅜, ⅝, ⅞
    const fracRegex = /(\d+[\/⁄]\d+|[¼½¾⅛⅜⅝⅞])/g;

    return escaped.replace(fracRegex, (match) => {
      return `<span class="dim-frac card-dim-frac">${match}</span>`;
    });
  }

  function adjustMeasurementsColLayout() {
    if (!el.measurementList) return;
    const cols = el.measurementList.querySelectorAll('.card-measurements-col');
    cols.forEach(col => {
      const lines = col.querySelectorAll('.card-dim-line');
      if (lines.length <= 1) {
        col.classList.remove('is-multiline');
        return;
      }
      col.classList.remove('is-multiline');
      const firstTop = lines[0].offsetTop;
      let hasWrapped = false;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].offsetTop > firstTop + 2) {
          hasWrapped = true;
          break;
        }
      }
      if (hasWrapped) {
        col.classList.add('is-multiline');
      }
    });
  }

  function renderMeasurementList() {
    if (!currentProject) return;
    const items = currentProject.items || [];
    const filtered = getFilteredItems();

    // If project has no measurements at all, show starter onboarding empty state
    if (items.length === 0) {
      el.measurementList.innerHTML = '';
      el.emptyState.style.display = 'flex';
      return;
    }

    // If project has items, but current search / filter returned zero matches
    if (filtered.length === 0) {
      el.emptyState.style.display = 'none';
      const filterDesc = searchQuery
        ? `search query "${escapeHtml(searchQuery)}"`
        : `category "${escapeHtml(currentFilterCategory)}"`;
      el.measurementList.innerHTML = `
        <div class="empty-filter-state">
          <div class="empty-filter-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div class="empty-filter-title">No matching measurements</div>
          <div class="empty-filter-desc">No measurements match ${filterDesc}</div>
          <button type="button" class="btn btn-secondary btn-sm" id="btnResetFilter" style="margin-top: 8px; cursor: pointer;">
            Clear Search &amp; Filter
          </button>
        </div>
      `;
      const btnReset = el.measurementList.querySelector('#btnResetFilter');
      if (btnReset) {
        btnReset.onclick = () => {
          searchQuery = '';
          el.searchInput.value = '';
          el.btnClearSearch.style.display = 'none';
          currentFilterCategory = 'ALL';
          renderAll();
        };
      }
      return;
    }

    el.emptyState.style.display = 'none';
    el.measurementList.innerHTML = '';

    filtered.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `measurement-card ${item.verified ? 'verified' : ''}`;
      card.dataset.id = item.id;

      const num = String(index + 1).padStart(2, '0');
      const isUpDisabled = index === 0;
      const isDownDisabled = index === filtered.length - 1;

      // Extract composite dimension parts (L × W × H, L:10.5cm W:12in, etc.)
      const rawVal = (item.value !== '' && item.value != null) ? String(item.value).trim() : '';
      const parts = parseCardMeasurementParts(rawVal, item.unit, item.label);

      let dimsHtml = '';
      parts.forEach((p) => {
        dimsHtml += `
          <div class="card-dim-line">
            <span class="card-dim-prefix">${escapeHtml(p.prefix)}</span>
            <span class="card-dim-val">${formatFractionValueHtml(p.value, p.unit || item.unit)}</span>
            ${p.unit ? `<span class="card-dim-unit">${escapeHtml(p.unit)}</span>` : ''}
          </div>
        `;
      });

      const labelText = item.label
        ? escapeHtml(item.label)
        : (item.category && item.category !== 'General' ? escapeHtml(item.category) : 'Dimension');

      card.innerHTML = `
        <div class="card-main-col">
          <div class="card-title">${labelText}</div>
          <div class="card-measurements-col">
            ${dimsHtml}
          </div>
        </div>
        <button type="button" class="check-toggle-btn ${item.verified ? 'checked' : ''}" title="${item.verified ? 'Verified on-site (tap to unverify)' : 'Mark as verified on-site'}" data-action="toggle-check" aria-label="Toggle verified status">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <div class="card-right-col" data-stop-propagation>
          <button type="button" class="stepper-arrow-btn stepper-btn-up ${isUpDisabled ? 'disabled' : ''}" data-action="move-up" title="Move Up" aria-label="Move Up" ${isUpDisabled ? 'disabled' : ''}>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.5L6 1.5L10.5 5.5"/></svg>
          </button>
          <span class="card-index-num">${num}</span>
          <button type="button" class="stepper-arrow-btn stepper-btn-down ${isDownDisabled ? 'disabled' : ''}" data-action="move-down" title="Move Down" aria-label="Move Down" ${isDownDisabled ? 'disabled' : ''}>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5L6 5.5L10.5 1.5"/></svg>
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="toggle-check"]')) {
          e.stopPropagation();
          toggleItemVerified(item.id);
          return;
        }

        // Stepper reorder buttons: move item up or down
        if (e.target.closest('[data-action="move-up"]')) {
          e.stopPropagation();
          const btn = e.target.closest('[data-action="move-up"]');
          if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
            moveItem(item.id, -1);
          }
          return;
        }
        if (e.target.closest('[data-action="move-down"]')) {
          e.stopPropagation();
          const btn = e.target.closest('[data-action="move-down"]');
          if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
            moveItem(item.id, 1);
          }
          return;
        }

        if (e.target.closest('[data-stop-propagation]')) {
          e.stopPropagation();
          return;
        }

        openEditMeasurementModal(item);
      });

      el.measurementList.appendChild(card);
    });

    adjustMeasurementsColLayout();
    requestAnimationFrame(adjustMeasurementsColLayout);
  }

  function moveItem(itemId, delta) {
    if (!currentProject || !currentProject.items) return;
    const items = currentProject.items;
    const visible = getFilteredItems();
    const vIdx = visible.findIndex(i => i.id === itemId);
    if (vIdx === -1) return;

    const targetVIdx = vIdx + delta;
    if (targetVIdx < 0 || targetVIdx >= visible.length) return;

    const targetItem = visible[targetVIdx];
    const actualIdx = items.findIndex(i => i.id === itemId);
    const targetActualIdx = items.findIndex(i => i.id === targetItem.id);
    if (actualIdx === -1 || targetActualIdx === -1) return;

    // Swap items in currentProject.items
    const temp = items[actualIdx];
    items[actualIdx] = items[targetActualIdx];
    items[targetActualIdx] = temp;

    // Mobile tactile feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }

    currentProject.updatedAt = new Date().toISOString();
    saveData();
    renderMeasurementList();
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
    updateCompositeCalc();
  }

  function updateCompositeCalc() {
    const unit = (el.selectItemUnit && el.selectItemUnit.value) ? el.selectItemUnit.value : 'cm';
    const l = parseFractionOrDecimal(el.inputDimL ? el.inputDimL.value : '', unit) || 0;
    const w = parseFractionOrDecimal(el.inputDimW ? el.inputDimW.value : '', unit) || 0;
    const h = parseFractionOrDecimal(el.inputDimH ? el.inputDimH.value : '', unit) || 0;

    if (!el.compositeCalcBadge) return;

    if (l > 0 && w > 0 && h > 0) {
      activeDimMode = '3d';
      const vol = (l * w * h).toFixed(2).replace(/\.00$/, '');
      const area = (l * w).toFixed(2).replace(/\.00$/, '');
      el.compositeCalcBadge.textContent = `📦 Vol: ${vol} ${unit}³ • Area: ${area} ${unit}²`;
      el.compositeCalcBadge.style.display = 'block';
    } else if (w > 0 && h > 0 && !(l > 0)) {
      activeDimMode = '2d';
      const area = (w * h).toFixed(2).replace(/\.00$/, '');
      el.compositeCalcBadge.textContent = `📐 Area (W × H): ${area} ${unit}²`;
      el.compositeCalcBadge.style.display = 'block';
    } else if (l > 0 && h > 0 && !(w > 0)) {
      activeDimMode = '2d';
      const area = (l * h).toFixed(2).replace(/\.00$/, '');
      el.compositeCalcBadge.textContent = `📐 Area (L × H): ${area} ${unit}²`;
      el.compositeCalcBadge.style.display = 'block';
    } else if (l > 0 && w > 0) {
      activeDimMode = '2d';
      const area = (l * w).toFixed(2).replace(/\.00$/, '');
      el.compositeCalcBadge.textContent = `📐 Area: ${area} ${unit}²`;
      el.compositeCalcBadge.style.display = 'block';
    } else {
      activeDimMode = '1d';
      el.compositeCalcBadge.style.display = 'none';
    }
  }

  function renderCategorySuggestions() {
    // Combine standard default categories with any existing categories in the current sheet
    const catSet = new Set(DEFAULT_CATEGORIES);
    if (currentProject && currentProject.items) {
      currentProject.items.forEach(it => {
        if (it.category && it.category.trim()) {
          catSet.add(it.category.trim());
        }
      });
    }
    const allCats = Array.from(catSet);

    // Update datalist so keyboard typing gets autocomplete
    if (el.categoryList) {
      el.categoryList.innerHTML = allCats.map(cat => `<option value="${escapeHtml(cat)}">`).join('');
    }

    // Render quick suggestion chips if container exists
    if (el.categorySuggestions) {
      const currentVal = (el.inputItemCategory ? el.inputItemCategory.value.trim() : '').toLowerCase();
      el.categorySuggestions.innerHTML = allCats.map(cat => {
        const isMatched = currentVal === cat.toLowerCase();
        return `<button type="button" class="sugg-chip ${isMatched ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
      }).join('');

      el.categorySuggestions.querySelectorAll('.sugg-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const chosen = btn.dataset.cat;
          el.inputItemCategory.value = chosen;
          renderCategorySuggestions();
        });
      });
    }
  }

  function updateVerifiedCheckboxUI() {
    if (!el.checkVerified) return;
    const isChecked = el.checkVerified.checked;
    const card = el.verifiedCheckboxCard || el.checkVerified.closest('.verified-checkbox-card');
    if (card) {
      if (isChecked) {
        card.classList.add('is-checked');
      } else {
        card.classList.remove('is-checked');
      }
    }
    if (el.verifiedStatusPill) {
      if (isChecked) {
        el.verifiedStatusPill.textContent = '✓ Verified';
        el.verifiedStatusPill.classList.add('is-verified');
      } else {
        el.verifiedStatusPill.textContent = 'Unverified';
        el.verifiedStatusPill.classList.remove('is-verified');
      }
    }
  }

  function openAddMeasurementModal() {
    activeEditingItemId = null;
    el.measurementModalTitle.querySelector('span').textContent = 'Add Measurement';
    el.btnDeleteMeasurement.style.display = 'none';
    el.btnSaveAndNext.style.display = 'inline-flex';

    // Reset inputs
    el.inputItemLabel.value = '';
    if (el.inputItemValue) el.inputItemValue.value = '';
    if (el.inputDimL) el.inputDimL.value = '';
    if (el.inputDimW) el.inputDimW.value = '';
    if (el.inputDimH) el.inputDimH.value = '';
    el.inputItemNotes.value = '';
    if (el.checkVerified) el.checkVerified.checked = false;
    updateVerifiedCheckboxUI();
    activeDimMode = '1d';
    lastActiveDimInput = el.inputDimL;
    if (el.compositeCalcBadge) el.compositeCalcBadge.style.display = 'none';

    // Retain last used unit and category for quick consecutive note taking
    const lastItem = currentProject.items && currentProject.items[currentProject.items.length - 1];
    if (currentFilterCategory !== 'ALL') {
      el.inputItemCategory.value = currentFilterCategory;
    } else if (lastItem && lastItem.category) {
      el.inputItemCategory.value = lastItem.category;
    } else {
      el.inputItemCategory.value = 'General';
    }

    if (lastItem) {
      el.selectItemUnit.value = lastItem.unit || 'cm';
    } else {
      el.selectItemUnit.value = 'cm';
    }
    lastSelectedUnit = el.selectItemUnit.value;
    syncUnitDisplay();
    applyKbdMode(currentKbdMode, false);

    renderCategorySuggestions();
    openPopup(el.popupMeasurement);
  }

  function openEditMeasurementModal(item) {
    activeEditingItemId = item.id;
    el.measurementModalTitle.querySelector('span').textContent = 'Edit Measurement';
    el.btnDeleteMeasurement.style.display = 'inline-flex';
    el.btnSaveAndNext.style.display = 'none';

    el.inputItemLabel.value = item.label || '';
    el.selectItemUnit.value = item.unit || 'cm';
    lastSelectedUnit = el.selectItemUnit.value;
    syncUnitDisplay();
    el.inputItemCategory.value = item.category || '';
    el.inputItemNotes.value = item.notes || '';
    if (el.checkVerified) el.checkVerified.checked = !!item.verified;
    updateVerifiedCheckboxUI();

    // Parse value into L, W, H fields, respecting directional prefixes and item context
    const val = String(item.value || '').trim();
    let lVal = '';
    let wVal = '';
    let hVal = '';

    if (/(^|\s)[LWHlwh]:/.test(val)) {
      const parts = val.split(/(?=\b[LWHlwh]:)/i).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        const m = p.match(/^([LWHlwh]):\s*(.*)$/i);
        if (m) {
          const pfx = m[1].toUpperCase();
          const pContent = m[2].replace(/[×xX]\s*$/, '').trim();
          if (pfx === 'L') lVal = pContent;
          else if (pfx === 'W') wVal = pContent;
          else if (pfx === 'H') hVal = pContent;
        }
      });
    }

    if (lVal || wVal || hVal) {
      if (el.inputDimL) el.inputDimL.value = lVal;
      if (el.inputDimW) el.inputDimW.value = wVal;
      if (el.inputDimH) el.inputDimH.value = hVal;
      if (lVal && wVal && hVal) activeDimMode = '3d';
      else if ((lVal && wVal) || (wVal && hVal) || (lVal && hVal)) activeDimMode = '2d';
      else activeDimMode = '1d';
    } else if (val.includes('×') || (val.search(/\s+[xX]\s+/) !== -1)) {
      const parts = val.split(/\s*[×xX]\s*/).map(s => s.trim());
      const lower = (item.label || '').toLowerCase();
      const isWidthHeight = lower.includes('door') || lower.includes('window') || lower.includes('opening') || lower.includes('elevation') || (lower.includes('height') && lower.includes('width'));

      if (parts.length >= 3) {
        activeDimMode = '3d';
        if (el.inputDimL) el.inputDimL.value = parts[0] || '';
        if (el.inputDimW) el.inputDimW.value = parts[1] || '';
        if (el.inputDimH) el.inputDimH.value = parts[2] || '';
      } else if (parts.length === 2) {
        activeDimMode = '2d';
        if (isWidthHeight) {
          if (el.inputDimL) el.inputDimL.value = '';
          if (el.inputDimW) el.inputDimW.value = parts[0] || '';
          if (el.inputDimH) el.inputDimH.value = parts[1] || '';
        } else {
          if (el.inputDimL) el.inputDimL.value = parts[0] || '';
          if (el.inputDimW) el.inputDimW.value = parts[1] || '';
          if (el.inputDimH) el.inputDimH.value = '';
        }
      }
    } else {
      activeDimMode = '1d';
      const lower = (item.label || '').toLowerCase();
      if (lower.includes('height') || lower.includes('rise') || lower.includes('ceiling') || lower.includes('thick')) {
        if (el.inputDimL) el.inputDimL.value = '';
        if (el.inputDimW) el.inputDimW.value = '';
        if (el.inputDimH) el.inputDimH.value = val;
      } else if (lower.includes('width') || lower.includes('opening') || lower.includes('span')) {
        if (el.inputDimL) el.inputDimL.value = '';
        if (el.inputDimW) el.inputDimW.value = val;
        if (el.inputDimH) el.inputDimH.value = '';
      } else {
        if (el.inputDimL) el.inputDimL.value = val;
        if (el.inputDimW) el.inputDimW.value = '';
        if (el.inputDimH) el.inputDimH.value = '';
      }
    }
    if (el.inputItemValue) el.inputItemValue.value = val;

    lastActiveDimInput = (el.inputDimW && el.inputDimW.value && !el.inputDimL.value) ? el.inputDimW : (el.inputDimH && el.inputDimH.value && !el.inputDimL.value ? el.inputDimH : el.inputDimL);
    applyKbdMode(currentKbdMode, false);
    updateCompositeCalc();
    renderCategorySuggestions();
    openPopup(el.popupMeasurement);
  }

  function saveCurrentMeasurement(andNext = false) {
    const label = el.inputItemLabel.value.trim();
    let unit = el.selectItemUnit.value;
    let value = '';

    const resolveCad = (str) => {
      if (!str) return '';
      if (window.CADParser) {
        if (window.CADParser.isFractionOrSingleDimension(str)) {
          return str;
        }
        if (window.CADParser.isUnresolvedMathExpression(str)) {
          return window.CADParser.resolveExpressionString(str, unit);
        }
      }
      return str;
    };

    let l = el.inputDimL ? el.inputDimL.value.trim() : '';
    let w = el.inputDimW ? el.inputDimW.value.trim() : '';
    let h = el.inputDimH ? el.inputDimH.value.trim() : '';

    if (!l && !w && !h) {
      showToast('⚠️ Please enter a dimension value');
      return;
    }

    // Auto-detect unit from any typed dimension
    const detected = detectUnitFromInputString(l) || detectUnitFromInputString(w) || detectUnitFromInputString(h);
    if (detected && el.selectItemUnit && el.selectItemUnit.value !== detected) {
      el.selectItemUnit.value = detected;
      lastSelectedUnit = detected;
      syncUnitDisplay();
      unit = detected;
    }

    l = resolveCad(stripRedundantUnit(l, unit));
    w = resolveCad(stripRedundantUnit(w, unit));
    h = resolveCad(stripRedundantUnit(h, unit));

    // Strip accidental leading prefixes from individual fields before saving
    l = l.replace(/^[LWHlwh]\s*:\s*/i, '').trim();
    w = w.replace(/^[LWHlwh]\s*:\s*/i, '').trim();
    h = h.replace(/^[LWHlwh]\s*:\s*/i, '').trim();

    if (el.inputDimL) el.inputDimL.value = l;
    if (el.inputDimW) el.inputDimW.value = w;
    if (el.inputDimH) el.inputDimH.value = h;

    if (l && w && h) {
      value = `L: ${l} × W: ${w} × H: ${h}`;
      activeDimMode = '3d';
    } else if (w && h && !l) {
      // User explicitly entered Width and Height (e.g. doors, windows, walls)
      value = `W: ${w} × H: ${h}`;
      activeDimMode = '2d';
    } else if (l && h && !w) {
      // User entered Length and Height
      value = `L: ${l} × H: ${h}`;
      activeDimMode = '2d';
    } else if (l && w && !h) {
      // User entered Length and Width
      value = `L: ${l} × W: ${w}`;
      activeDimMode = '2d';
    } else if (h && !l && !w) {
      // Height only
      value = `H: ${h}`;
      activeDimMode = '1d';
    } else if (w && !l && !h) {
      // Width only
      value = `W: ${w}`;
      activeDimMode = '1d';
    } else {
      // Length only
      value = l || '';
      activeDimMode = '1d';
    }

    if (el.inputItemValue) el.inputItemValue.value = value;

    const category = el.inputItemCategory.value.trim() || 'General';
    let notes = el.inputItemNotes.value.trim();
    const verified = el.checkVerified ? el.checkVerified.checked : false;

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
        if (el.checkVerified) el.checkVerified.checked = false;
        updateVerifiedCheckboxUI();
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

  // ==========================================================================
  // PROJECT / SHEET MANAGER (Modal)
  // ==========================================================================

  function openProjectsModal(editingProjectId = null) {
    renderProjectList(editingProjectId);
    el.inputNewProjectName.value = '';
    openPopup(el.popupProjects);
  }

  function renderProjectList(editingProjectId = null) {
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
      const isEditing = editingProjectId && (proj.id === editingProjectId);
      const card = document.createElement('div');
      card.className = `project-item-card ${isCurrent ? 'active' : ''} ${isEditing ? 'editing' : ''}`;
      
      const itemCount = (proj.items || []).length;
      const dateStr = proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : 'Recent';

      if (isEditing) {
        card.innerHTML = `
          <div class="project-card-edit-mode">
            <div class="edit-sheet-header-label">
              <span style="font-size: 0.74rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.05em;">Rename Sheet</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Press Enter to save</span>
            </div>
            <div class="project-rename-input-row">
              <input type="text" class="form-input project-rename-input" id="inputRename_${proj.id}" value="${escapeHtml(proj.title)}" autocomplete="off" spellcheck="false">
              <button type="button" class="btn btn-primary btn-sm" data-action="save-rename" data-id="${proj.id}" title="Save Name">Save</button>
              <button type="button" class="btn btn-secondary btn-sm" data-action="cancel-rename" title="Cancel">Cancel</button>
            </div>
          </div>
        `;
      } else {
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
            <button type="button" class="proj-action-btn edit" data-action="rename" title="Rename Sheet" aria-label="Rename Sheet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
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
      }

      card.addEventListener('click', (e) => {
        const saveBtn = e.target.closest('[data-action="save-rename"]');
        if (saveBtn) {
          e.stopPropagation();
          const renameInput = card.querySelector(`#inputRename_${proj.id}`);
          saveProjectRename(proj.id, renameInput ? renameInput.value : '');
          return;
        }
        const cancelBtn = e.target.closest('[data-action="cancel-rename"]');
        if (cancelBtn) {
          e.stopPropagation();
          renderProjectList();
          return;
        }
        if (e.target.closest('.project-rename-input')) {
          e.stopPropagation();
          return;
        }
        if (e.target.closest('[data-action="rename"]')) {
          e.stopPropagation();
          renderProjectList(proj.id);
          return;
        }
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
        if (!isEditing) {
          switchActiveProject(proj.id);
        }
      });

      el.projectListContainer.appendChild(card);

      if (isEditing) {
        const renameInput = card.querySelector(`#inputRename_${proj.id}`);
        if (renameInput) {
          setTimeout(() => {
            renameInput.focus();
            renameInput.select();
          }, 40);
          renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveProjectRename(proj.id, renameInput.value);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              renderProjectList();
            }
          });
        }
      }
    });
  }

  function saveProjectRename(projectId, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) {
      showToast('⚠️ Sheet name cannot be empty');
      return;
    }
    const target = projects.find(p => p.id === projectId);
    if (!target) return;

    target.title = trimmed;
    target.updatedAt = new Date().toISOString();

    if (currentProject && currentProject.id === projectId) {
      currentProject.title = trimmed;
      if (el.displayProjectTitle) {
        el.displayProjectTitle.textContent = trimmed;
      }
    }

    saveData();
    renderProjectList();
    renderHeaderAndStats();
    showToast(`✓ Renamed sheet: ${trimmed}`);
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

  function syncCheckboxChip(chip) {
    if (!chip) return;
    const input = chip.querySelector('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) {
      chip.classList.add('is-checked');
    } else {
      chip.classList.remove('is-checked');
    }
  }

  function syncAllCheckboxChips() {
    document.querySelectorAll('.pdf-checkbox-chip').forEach(syncCheckboxChip);
  }

  function openPdfModal() {
    if (!currentProject) return;
    el.pdfTitleInput.value = currentProject.title ? `MEASUREMENT SHEET: ${currentProject.title.toUpperCase()}` : 'MEASUREMENT SPECIFICATION SHEET';
    el.pdfClientInput.value = currentProject.client || '';
    if (el.brandingDetails) {
      el.brandingDetails.open = !!(companyBranding.name || companyBranding.contact || companyBranding.logo);
    }
    const items = currentProject.items || [];
    const verifiedCount = items.filter(i => i.verified).length;
    if (el.pdfVerifiedBadge) {
      el.pdfVerifiedBadge.textContent = `${verifiedCount}`;
      el.pdfVerifiedBadge.title = `${verifiedCount} verified of ${items.length} items`;
    }
    syncAllCheckboxChips();
    updatePdfPreview();
    openPopup(el.popupPdf);
  }

  function getPdfExportOptions() {
    const incArea = el.pdfIncludeArea ? el.pdfIncludeArea.checked : false;
    const incVolume = el.pdfIncludeVolume ? el.pdfIncludeVolume.checked : false;
    const incCategories = el.pdfIncludeCategories ? el.pdfIncludeCategories.checked : false;
    const incNotes = el.pdfIncludeNotes ? el.pdfIncludeNotes.checked : false;
    const onlyVerified = el.pdfOnlyVerified ? el.pdfOnlyVerified.checked : false;
    return {
      title: el.pdfTitleInput.value || 'MEASUREMENT SHEET',
      client: el.pdfClientInput.value || 'General',
      includeSketch: el.pdfIncludeSketch ? el.pdfIncludeSketch.checked : false,
      includeSignature: el.pdfIncludeSign ? el.pdfIncludeSign.checked : false,
      compact: true,
      includeArea: incArea,
      includeVolume: incVolume,
      includeAreaVolume: incArea || incVolume,
      includeCategories: incCategories,
      includeNotes: incNotes,
      onlyVerified: onlyVerified,
      commonUnit: el.pdfCommonUnit ? el.pdfCommonUnit.value : '',
      areaUnitFormat: el.pdfAreaUnitFormat ? el.pdfAreaUnitFormat.value : '',
      companyName: companyBranding.name || '',
      companyContact: companyBranding.contact || '',
      companyLogo: companyBranding.logo || null
    };
  }

  function updatePdfPreview() {
    if (!currentProject) return;
    saveBranding();
    const options = getPdfExportOptions();
    const items = currentProject.items || [];
    const sheetHtml = window.PDFGenerator.renderPrintDOM(
      currentProject,
      items,
      currentProject.sketchData,
      options
    );

    // Render directly into preview box for full native scrolling
    el.pdfLivePreview.innerHTML = sheetHtml;

    // Populate hidden #print-page-layout for native @media print
    el.printPageLayout.innerHTML = sheetHtml;
  }

  function executePrint() {
    updatePdfPreview();
    window.print();
  }

  function downloadPdfFile() {
    if (!currentProject) return;
    const options = getPdfExportOptions();
    const items = currentProject.items || [];
    window.PDFGenerator.downloadPDF(currentProject, items, options);
    showToast('✓ PDF download started');
  }

  function downloadCsvFile() {
    if (!currentProject) return;
    const options = getPdfExportOptions();
    const items = currentProject.items || [];
    window.PDFGenerator.downloadCSV(currentProject, items, options);
    showToast('✓ CSV cut-list downloaded');
  }

  async function executeShareSheet() {
    if (!currentProject) return;
    const options = getPdfExportOptions();
    const items = currentProject.items || [];
    const textSummary = generateTextSummary(currentProject, options, items);
    const cleanTitle = (currentProject.title || 'Measurement_Sheet').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanTitle}.pdf`;

    if (navigator.share) {
      // Direct share invocation inside user activation
      let shareData = {
        title: currentProject.title || 'Measurement Sheet',
        text: textSummary
      };

      // Try file sharing if supported by browser/platform
      try {
        if (typeof File !== 'undefined' && navigator.canShare) {
          const pdfBlob = window.PDFGenerator.generatePDFBlob(currentProject, items, options);
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            shareData.files = [pdfFile];
          }
        }
      } catch (fileErr) {
        console.warn('File share check fallback:', fileErr);
      }

      try {
        await navigator.share(shareData);
        showToast('✓ Shared via system sheet');
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User closed the native mobile share sheet, do not trigger fallback download
          return;
        }
        // If file sharing was rejected, retry sharing just text
        if (shareData.files) {
          try {
            await navigator.share({
              title: currentProject.title || 'Measurement Sheet',
              text: textSummary
            });
            showToast('✓ Shared text summary');
            return;
          } catch (textErr) {
            if (textErr.name === 'AbortError') return;
            console.warn('Text share failed:', textErr);
          }
        }
      }
    }

    // Desktop or non-share fallback
    copyTextSummary(items, options);
    window.PDFGenerator.downloadPDF(currentProject, items, options);
    showToast('✓ Summary copied & PDF downloaded');
  }

  function generateTextSummary(proj, options = {}, customItems = null) {
    const opts = { ...getPdfExportOptions(), ...options };
    let items = (Array.isArray(customItems) ? customItems : null) || proj.items || [];
    if (opts.onlyVerified && !customItems) {
      items = items.filter(i => i.verified);
    }
    const commonUnit = opts.commonUnit || '';
    let text = `📐 ${proj.title.toUpperCase()}${opts.onlyVerified ? ' (VERIFIED ONLY)' : ''}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (proj.client) text += `Client: ${proj.client}\n`;
    if (companyBranding && companyBranding.name) text += `Contractor: ${companyBranding.name}\n`;
    text += `------------------------------------\n`;

    const areaByUnit = {};
    const volByUnit = {};

    items.forEach((item, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const v = item.verified ? ' [✓]' : '';
      const display = window.PDFGenerator.getDisplayItem(item, commonUnit, opts.areaUnitFormat || '');
      const u = display.unit || item.unit || '';
      const au = display.areaUnit || (u ? `${u}²` : 'unit²');

      if (display.area !== null) {
        areaByUnit[au] = (areaByUnit[au] || 0) + display.area;
      }
      if (display.volume !== null) {
        volByUnit[u] = (volByUnit[u] || 0) + display.volume;
      }

      let extra = '';
      if (opts.includeArea && display.area !== null) {
        const areaFmt = window.PDFGenerator.formatAreaNumber ? window.PDFGenerator.formatAreaNumber(display.area) : window.PDFGenerator.formatNumber(display.area);
        extra += ` [Area: ${areaFmt} ${au}]`;
      }
      if (opts.includeVolume && display.volume !== null) {
        extra += ` [Vol: ${window.PDFGenerator.formatNumber(display.volume)} ${u}³]`;
      }

      const printVal = (window.PDFGenerator && window.PDFGenerator.formatPrintValueText)
        ? window.PDFGenerator.formatPrintValueText(display.value, item.label, u)
        : display.value;
      text += `${num}. ${item.label}${v}: ${printVal} ${u}${extra}`;
      if (opts.includeCategories && item.category) text += ` [${item.category}]`;
      if (opts.includeNotes && item.notes) text += ` (${item.notes})`;
      text += `\n`;
    });

    text += `------------------------------------\n`;
    text += `Total items: ${items.length}\n`;

    if (opts.includeArea) {
      const aTotals = Object.entries(areaByUnit).map(([u, val]) => {
        const areaFmt = window.PDFGenerator.formatAreaNumber ? window.PDFGenerator.formatAreaNumber(val) : window.PDFGenerator.formatNumber(val);
        return `${areaFmt} ${u}`;
      });
      if (aTotals.length > 0) text += `Total Area: ${aTotals.join(', ')}\n`;
    }
    if (opts.includeVolume) {
      const vTotals = Object.entries(volByUnit).map(([u, val]) => `${window.PDFGenerator.formatNumber(val)} ${u}³`);
      if (vTotals.length > 0) text += `Total Volume: ${vTotals.join(', ')}\n`;
    }

    return text;
  }

  function setCopyButtonFeedback() {
    if (!el.btnCopyTextSummary) return;
    const btn = el.btnCopyTextSummary;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span style="color: #22c55e; font-weight: 600;">✓ Copied!</span>
    `;
    btn.style.borderColor = 'rgba(34, 197, 94, 0.5)';
    btn.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.borderColor = '';
      btn.style.backgroundColor = '';
    }, 2000);
  }

  function copyTextSummary(customItems = null, customOptions = null) {
    if (!currentProject) return;
    if (customItems && (!Array.isArray(customItems) || (typeof Event !== 'undefined' && customItems instanceof Event))) {
      customItems = null;
    }
    const text = generateTextSummary(currentProject, customOptions || {}, customItems);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Measurement summary copied to clipboard');
        setCopyButtonFeedback();
      }).catch(() => {
        fallbackCopy(text);
        setCopyButtonFeedback();
      });
    } else {
      fallbackCopy(text);
      setCopyButtonFeedback();
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

  function handleCsvFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!currentProject) {
      showToast('⚠️ No active sheet selected');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target.result;
        const parsedItems = window.PDFGenerator.parseCSV(csvContent);

        if (!parsedItems || parsedItems.length === 0) {
          showToast('⚠️ No valid measurement rows found in CSV');
          e.target.value = '';
          return;
        }

        if (!currentProject.items) {
          currentProject.items = [];
        }

        const append = !el.checkAppendTemplate || el.checkAppendTemplate.checked;
        if (!append && currentProject.items.length > 0) {
          if (!confirm('Replace existing measurements with imported CSV items?')) {
            e.target.value = '';
            return;
          }
          currentProject.items = [];
        }

        parsedItems.forEach(item => {
          currentProject.items.push({
            id: 'm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            label: item.label,
            value: item.value,
            unit: item.unit || 'cm',
            category: item.category || 'General',
            notes: item.notes || '',
            verified: !!item.verified,
            createdAt: new Date().toISOString()
          });
        });

        currentProject.updatedAt = new Date().toISOString();
        saveData();
        renderAll();
        showToast(`✓ Imported ${parsedItems.length} items from CSV`);

        // Close templates popup if open
        if (el.popupTemplates && el.popupTemplates.classList.contains('active')) {
          closeAllPopups();
        }

        // If PDF preview modal is open, refresh preview
        if (el.popupPdf && el.popupPdf.classList.contains('active')) {
          updatePdfPreview();
        }
      } catch (err) {
        console.error('CSV import error:', err);
        showToast('⚠️ Error parsing CSV file');
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      showToast('⚠️ Failed to read CSV file');
      e.target.value = '';
    };

    reader.readAsText(file);
  }

  // ==========================================================================
  // TEMPLATES (Starter Presets & Custom User Templates)
  // ==========================================================================

  function updateTemplateAppendCheckboxUI() {
    if (!el.checkAppendTemplate) return;
    const card = el.templateCheckboxCard || el.checkAppendTemplate.closest('.template-checkbox-card');
    if (card) {
      if (el.checkAppendTemplate.checked) {
        card.classList.add('is-checked');
      } else {
        card.classList.remove('is-checked');
      }
    }
  }

  function openTemplatesModal() {
    renderCustomTemplates();
    updateTemplateAppendCheckboxUI();
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
        value: item.value || '',
        unit: item.unit || 'cm',
        category: item.category || 'General',
        notes: item.notes || '',
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
        value: item.value || '',
        unit: item.unit || 'cm',
        category: item.category || 'General',
        notes: item.notes || '',
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
      const rawVal = el.convFromVal.value;
      const from = el.convFromUnit.value;
      const to = el.convToUnit.value;
      let val = parseFractionOrDecimal(rawVal, from);
      if (isNaN(val)) val = 0;

      const toMm = {
        mm: 1,
        cm: 10,
        m: 1000,
        in: 25.4,
        ft: 304.8,
        yd: 914.4
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
          el.fractionResult.innerHTML = `Fraction: ${whole > 0 ? whole + ' ' : ''}<span class="dim-frac">${num}/${den}</span>"`;
        }
      } else {
        el.fractionResult.innerHTML = '';
      }
    };

    const calculateGeometry = () => {
      const l = parseFractionOrDecimal(el.calcL.value) || 0;
      const w = parseFractionOrDecimal(el.calcW.value) || 0;
      const h = parseFractionOrDecimal(el.calcH.value) || 0;

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

    let convertedCount = 0;
    currentProject.items.forEach(item => {
      const from = (item.unit || 'cm').toLowerCase();
      item.value = convertInputValueString(item.value, from, targetUnit);
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
    
    el.btnOpenProjects.addEventListener('click', () => openProjectsModal());
    if (el.btnHeaderRenameSheet) {
      el.btnHeaderRenameSheet.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentProject) return;
        openProjectsModal(currentProject.id);
      });
    }
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

    // Composite inputs calculations & unit change & live CAD hint & auto unit detection
    const checkAutoSyncUnit = (inputEl) => {
      if (!inputEl) return false;
      const detected = detectUnitFromInputString(inputEl.value);
      if (detected && el.selectItemUnit && el.selectItemUnit.value !== detected) {
        el.selectItemUnit.value = detected;
        lastSelectedUnit = detected;
        syncUnitDisplay();
        return true;
      }
      return false;
    };

    const onDimInputChange = (inputEl) => {
      // Auto-split if user typed or pasted "120 × 80" or "120 x 80" or "120x80" into Length:
      if (inputEl === el.inputDimL && inputEl.value) {
        const val = inputEl.value;
        if (val.includes('×') || /(?:\d|['"])\s*[xX]\s*(?:\d|['"])/.test(val) || (val.search(/\s+[xX]\s+/) !== -1)) {
          const parts = val.split(/\s*[×xX]\s*/);
          if (parts.length >= 2) {
            inputEl.value = parts[0] || '';
            if (el.inputDimW) el.inputDimW.value = parts[1] || '';
            if (parts[2] && el.inputDimH) el.inputDimH.value = parts[2] || '';
          }
        }
      }
      checkAutoSyncUnit(inputEl);
      updateCompositeCalc();
    };

    [el.inputDimL, el.inputDimW, el.inputDimH].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => onDimInputChange(inp));
      inp.addEventListener('blur', () => {
        const u = el.selectItemUnit ? el.selectItemUnit.value : 'cm';
        const cleaned = stripRedundantUnit(inp.value, u);
        if (cleaned !== inp.value) {
          inp.value = cleaned;
          updateCompositeCalc();
        }
      });
    });

    // Dimension unit dropdown selector & menu
    const dimUnitDropdown = document.getElementById('dimUnitDropdown');
    const dimUnitDropdownBtn = document.getElementById('dimUnitDropdownBtn');
    const dimUnitMenu = document.getElementById('dimUnitMenu');

    function toggleDimUnitDropdown(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!dimUnitDropdown) return;
      const isOpen = dimUnitDropdown.classList.contains('open');
      if (isOpen) {
        closeDimUnitDropdown();
      } else {
        dimUnitDropdown.classList.add('open');
        if (dimUnitDropdownBtn) dimUnitDropdownBtn.setAttribute('aria-expanded', 'true');
      }
    }

    if (dimUnitDropdownBtn) {
      dimUnitDropdownBtn.addEventListener('click', toggleDimUnitDropdown);
    }

    if (dimUnitMenu) {
      dimUnitMenu.querySelectorAll('.dim-unit-menu-item').forEach(itemEl => {
        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const newUnit = itemEl.dataset.unit;
          if (newUnit && el.selectItemUnit && el.selectItemUnit.value !== newUnit) {
            el.selectItemUnit.value = newUnit;
            el.selectItemUnit.dispatchEvent(new Event('change'));
          }
          closeDimUnitDropdown();
        });
      });
    }

    // Close unit dropdown on outside click or escape
    document.addEventListener('click', (e) => {
      if (dimUnitDropdown && !dimUnitDropdown.contains(e.target)) {
        closeDimUnitDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dimUnitDropdown && dimUnitDropdown.classList.contains('open')) {
        closeDimUnitDropdown();
      }
    });

    // Quick Keyboard Mode Toggle (123 ⟷ fx)
    document.querySelectorAll('.dim-kbd-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = chip.dataset.mode;
        if (mode && mode !== currentKbdMode) {
          applyKbdMode(mode, true);
          showToast(mode === '123' ? '🔢 Numeric Keypad (123)' : '📐 Formula Keyboard (fx)', 900);
        } else if (mode) {
          applyKbdMode(mode, true);
        }
      });
    });

    // Backward-compatibility: Segmented unit pill chips if present in DOM
    const dimUnitPill = document.getElementById('dimUnitPill');
    if (dimUnitPill) {
      dimUnitPill.querySelectorAll('.dim-unit-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const newUnit = chip.dataset.unit;
          if (!newUnit || (el.selectItemUnit && el.selectItemUnit.value === newUnit)) return;
          if (el.selectItemUnit) {
            el.selectItemUnit.value = newUnit;
            el.selectItemUnit.dispatchEvent(new Event('change'));
          } else {
            const oldUnit = lastSelectedUnit || 'cm';
            const converted = convertMeasurementInputs(oldUnit, newUnit);
            lastSelectedUnit = newUnit;
            syncUnitDisplay();
            updateCompositeCalc();
            if (converted > 0) {
              document.querySelectorAll('.toast-conversion').forEach(t => t.remove());
              const toast = showToast(`✓ Switched to ${newUnit}`, 1200);
              if (toast) toast.classList.add('toast-conversion');
            }
          }
        });
      });
    }

    // Unit badge click: cycle through units cm -> mm -> m -> in -> ft -> yd
    if (el.inputItemUnitBadge) {
      el.inputItemUnitBadge.addEventListener('click', () => {
        const UNIT_CYCLE = ['cm', 'mm', 'm', 'in', 'ft', 'yd'];
        const current = el.selectItemUnit ? el.selectItemUnit.value : 'cm';
        const idx = UNIT_CYCLE.indexOf(current);
        const nextUnit = UNIT_CYCLE[(idx + 1) % UNIT_CYCLE.length] || 'cm';
        if (el.selectItemUnit) {
          el.selectItemUnit.value = nextUnit;
          el.selectItemUnit.dispatchEvent(new Event('change'));
        }
      });
    }

    if (el.selectItemUnit) el.selectItemUnit.addEventListener('change', () => {
      const newUnit = el.selectItemUnit.value;
      const converted = convertMeasurementInputs(lastSelectedUnit, newUnit);
      lastSelectedUnit = newUnit;
      syncUnitDisplay();

      updateCompositeCalc();

      if (converted > 0) {
        // Replace any previous conversion toast instead of stacking them.
        document.querySelectorAll('.toast-conversion').forEach(t => t.remove());
        const toast = showToast(`✓ Converted to ${UNIT_SYMBOLS[newUnit] || UNIT_LABELS[newUnit] || newUnit}`, 1400);
        if (toast) toast.classList.add('toast-conversion');
      }
    });

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
    const handleOutsideCategoryClose = (e) => {
      if (el.searchBoxUnified && !el.searchBoxUnified.contains(e.target)) {
        closeCategoryDropdown();
      }
    };
    document.addEventListener('pointerdown', handleOutsideCategoryClose);
    document.addEventListener('click', handleOutsideCategoryClose);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
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

    // Label quick suggestion chips (if present)
    if (el.labelSuggestions) {
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
    }

    // Category input auto-updates suggestion chip highlight
    if (el.inputItemCategory) {
      el.inputItemCategory.addEventListener('input', () => {
        renderCategorySuggestions();
      });
    }

    // Track active/focused input among L, W, H for helpers & keyboard
    lastActiveDimInput = el.inputDimL || el.inputItemValue;
    [el.inputDimL, el.inputDimW, el.inputDimH, el.inputItemValue].forEach(inputEl => {
      if (!inputEl) return;
      inputEl.addEventListener('focus', () => {
        lastActiveDimInput = inputEl;
      });
    });

    function insertAtCursor(input, text) {
      if (!input) return;
      const start = (input.selectionStart != null) ? input.selectionStart : input.value.length;
      const end = (input.selectionEnd != null) ? input.selectionEnd : input.value.length;
      const val = input.value;

      let insertion = text;
      // If inserting operator at start of empty input
      if (start === 0 && val.trim() === '') {
        if (text === ' - ') insertion = '-';
        else if (text === ' + ' || text === ' * ' || text === ' / ') insertion = '';
      } else if (start > 0 && (text === ' + ' || text === ' - ' || text === ' * ' || text === ' / ')) {
        // Prevent duplicate operators like "10 + + "
        if (/\s*[+\-*\/]\s*$/.test(val.substring(0, start))) {
          const replacedVal = val.substring(0, start).replace(/\s*[+\-*\/]\s*$/, '') + text;
          input.value = replacedVal + val.substring(end);
          const newPos = replacedVal.length;
          input.setSelectionRange(newPos, newPos);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }

      input.value = val.substring(0, start) + insertion + val.substring(end);
      const newPos = start + insertion.length;
      input.setSelectionRange(newPos, newPos);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Quick numeric increment / fraction / CAD buttons (shared across L, W, H)
    document.querySelectorAll('.quick-value-helpers button').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = lastActiveDimInput || el.inputDimL || el.inputItemValue;
        if (!target) return;
        const current = target.value.trim();
        const unit = (el.selectItemUnit && el.selectItemUnit.value) ? el.selectItemUnit.value : 'in';

        // Immediate CAD evaluate button (=)
        if (btn.id === 'btnEvalCadExpr') {
          if (window.CADParser) {
            target.value = window.CADParser.resolveExpressionString(current, unit);
            target.focus();
            target.dispatchEvent(new Event('input', { bubbles: true }));
            updateCompositeCalc();
          }
          return;
        }

        // CAD direct keys (', ", +, -, *, /, (, ))
        const cad = btn.dataset.cad;
        if (cad) {
          target.focus();
          insertAtCursor(target, cad);
          checkAutoSyncUnit(target);
          updateCompositeCalc();
          return;
        }

        const inc = btn.dataset.inc;
        const frac = btn.dataset.frac;

        if (frac) {
          const stripped = current.replace(/\s*(?:mm|cm|m|in|ft|yd|"|'|”|′)$/i, '');
          target.value = stripped ? `${stripped.replace(/\s*(?:[¼½¾⅛⅜]|\d+\/\d+)$/, '')}${frac}`.trim() : frac.trim();
        } else if (inc) {
          const delta = parseFloat(inc) || 0;
          const val = parseFractionOrDecimal(current, unit);
          const base = isNaN(val) ? 0 : val;
          const next = Math.max(0, Math.round((base + delta) * 1000) / 1000);
          target.value = next;
        }

        target.focus();
        target.dispatchEvent(new Event('input', { bubbles: true }));
        updateCompositeCalc();
      });
    });

    // Keyboard navigation for Label, L, W, H
    if (el.inputItemLabel) {
      el.inputItemLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (el.inputDimL) el.inputDimL.focus();
        }
      });
    }

    [el.inputDimL, el.inputDimW, el.inputDimH].forEach(inputEl => {
      if (!inputEl) return;
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          el.btnSaveMeasurement.click();
        }
      });
    });

    if (el.inputDimL) {
      el.inputDimL.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (el.inputDimW) el.inputDimW.focus();
        }
      });
    }

    if (el.inputDimW) {
      el.inputDimW.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (el.inputDimH) {
            el.inputDimH.focus();
          } else {
            el.btnSaveMeasurement.click();
          }
        }
      });
    }

    if (el.inputDimH) {
      el.inputDimH.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
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
    if (el.pdfIncludeArea) el.pdfIncludeArea.addEventListener('change', updatePdfPreview);
    if (el.pdfIncludeVolume) el.pdfIncludeVolume.addEventListener('change', updatePdfPreview);
    if (el.pdfIncludeCategories) el.pdfIncludeCategories.addEventListener('change', updatePdfPreview);
    if (el.pdfIncludeNotes) el.pdfIncludeNotes.addEventListener('change', updatePdfPreview);
    if (el.pdfOnlyVerified) el.pdfOnlyVerified.addEventListener('change', updatePdfPreview);
    if (el.pdfCommonUnit) el.pdfCommonUnit.addEventListener('change', updatePdfPreview);
    if (el.pdfAreaUnitFormat) {
      el.pdfAreaUnitFormat.addEventListener('change', () => {
        if (el.pdfAreaUnitFormat.value && el.pdfIncludeArea && !el.pdfIncludeArea.checked) {
          el.pdfIncludeArea.checked = true;
          syncCheckboxChip(el.pdfIncludeArea.closest('.pdf-checkbox-chip'));
        }
        updatePdfPreview();
      });
    }

    // Sync all PDF checkbox chip visual active states on toggle
    document.querySelectorAll('.pdf-checkbox-chip input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        syncCheckboxChip(e.target.closest('.pdf-checkbox-chip'));
      });
    });

    // Checkbox UI listeners for Verification and Template Append cards
    if (el.checkVerified) {
      el.checkVerified.addEventListener('change', updateVerifiedCheckboxUI);
    }
    if (el.checkAppendTemplate) {
      el.checkAppendTemplate.addEventListener('change', updateTemplateAppendCheckboxUI);
    }

    // Share & export actions
    if (el.btnShareSheet) el.btnShareSheet.addEventListener('click', executeShareSheet);
    el.btnExecutePrint.addEventListener('click', executePrint);
    el.btnDownloadPdf.addEventListener('click', downloadPdfFile);
    if (el.btnDownloadCsv) el.btnDownloadCsv.addEventListener('click', downloadCsvFile);
    el.btnCopyTextSummary.addEventListener('click', () => copyTextSummary());

    // Export / Import Backup JSON
    el.btnExportData.addEventListener('click', exportBackup);
    el.importFileInput.addEventListener('change', importBackup);

    // CSV Import actions
    if (el.importCsvInput) el.importCsvInput.addEventListener('change', handleCsvFileImport);
    if (el.importCsvInputTemplate) el.importCsvInputTemplate.addEventListener('change', handleCsvFileImport);
    if (el.importCsvInputTemplateFooter) el.importCsvInputTemplateFooter.addEventListener('change', handleCsvFileImport);
    if (el.importCsvInputEmpty) el.importCsvInputEmpty.addEventListener('change', handleCsvFileImport);

    // Ensure printable DOM is ready before any print action
    window.addEventListener('beforeprint', updatePdfPreview);

    // Dynamic single line / line-by-line measurement responsive layout
    window.addEventListener('resize', () => {
      adjustMeasurementsColLayout();
    });

    if (window.ResizeObserver && el.measurementList) {
      let roTimer = null;
      const ro = new ResizeObserver(() => {
        if (roTimer) cancelAnimationFrame(roTimer);
        roTimer = requestAnimationFrame(() => {
          adjustMeasurementsColLayout();
        });
      });
      ro.observe(el.measurementList);
    }
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

    return toast;
  }

  // Expose key app interface helpers for testing and external integrations
  window.SizeNotesApp = {
    getCurrentProject: () => currentProject,
    setCurrentProject: (proj) => { currentProject = proj; renderAll(); saveData(); },
    getProjects: () => projects,
    updatePdfPreview,
    generateTextSummary,
    executeShareSheet,
    copyTextSummary,
    handleCsvFileImport
  };

  // --- Run on Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
