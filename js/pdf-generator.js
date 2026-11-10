/**
 * SizeNotes - PDF & CSV Generator Module
 * Provides:
 * 1. Print page DOM generation for native high-res window.print() (Save as PDF)
 * 2. Standalone pure JS PDF 1.4 binary generator for direct .pdf file download & sharing
 * 3. Excel-compatible CSV export for cut lists and CAD/spreadsheet pipelines
 */

const PDFGenerator = {
  /**
   * Parse a single dimension string (integer, decimal, pure fraction, mixed fraction, CAD expression)
   */
  parseSingleDimension(valStr, defaultUnit = 'in') {
    if (!valStr) return NaN;
    valStr = String(valStr).trim();

    if (typeof window !== 'undefined' && window.CADParser) {
      const num = window.CADParser.evaluateToNumber(valStr, defaultUnit);
      if (!isNaN(num)) return num;
    }

    // Mixed fraction, e.g. "40 1/2"
    if (valStr.includes(' ')) {
      const parts = valStr.split(/\s+/);
      const whole = parseFloat(parts[0]) || 0;
      if (parts[1] && parts[1].includes('/')) {
        const frac = parts[1].split('/');
        const num = parseFloat(frac[0]);
        const den = parseFloat(frac[1]);
        if (den !== 0) return whole + (num / den);
      }
      return whole;
    }

    // Pure fraction, e.g. "3/4"
    if (valStr.includes('/')) {
      const frac = valStr.split('/');
      const num = parseFloat(frac[0]);
      const den = parseFloat(frac[1]);
      if (den !== 0) return num / den;
    }

    return parseFloat(valStr);
  },

  /**
   * Computes Area (L × W) and Volume (L × W × H) for a measurement item
   */
  getItemGeometry(item) {
    if (!item) return { area: null, volume: null };

    let area = (typeof item.area === 'number' && !isNaN(item.area)) ? item.area : null;
    let volume = (typeof item.volume === 'number' && !isNaN(item.volume)) ? item.volume : null;

    if (area !== null && volume !== null) {
      return { area, volume };
    }

    const unit = (item && item.unit) ? item.unit : 'in';
    const val = String(item.value || '').trim();
    if (val.includes('×') || (val.search(/\s+[xX]\s+/) !== -1)) {
      const parts = val.split(/\s*[×xX]\s*/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const d1 = this.parseSingleDimension(parts[0], unit);
        const d2 = this.parseSingleDimension(parts[1], unit);
        if (!isNaN(d1) && !isNaN(d2) && d1 > 0 && d2 > 0) {
          if (area === null) area = d1 * d2;
          if (parts.length >= 3) {
            const d3 = this.parseSingleDimension(parts[2], unit);
            if (!isNaN(d3) && d3 > 0) {
              if (volume === null) volume = d1 * d2 * d3;
            }
          }
        }
      }
    }

    return { area, volume };
  },

  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
  },

  // Linear unit factors relative to one meter (mirrors app.js so printed
  // conversions match what the on-screen unit switcher does).
  unitFactors: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144
  },

  unitDecimals: { mm: 1, cm: 2, m: 4, in: 3, ft: 4, yd: 4 },

  convertLinear(value, fromUnit, toUnit) {
    if (!isFinite(value) || !fromUnit || !toUnit || fromUnit === toUnit) return value;
    const from = this.unitFactors[fromUnit];
    const to = this.unitFactors[toUnit];
    if (from === undefined || to === undefined) return value;
    return value * from / to;
  },

  formatLinear(value, unit) {
    if (!isFinite(value)) return '';
    const decimals = this.unitDecimals[unit];
    if (decimals === undefined) return this.formatNumber(value);
    const factor = Math.pow(10, decimals);
    return String(Math.round(value * factor) / factor);
  },

  // Parses a dimension without rounding it to the 3-decimal CAD "value" field,
  // so repeated unit conversions do not drift.
  parseDimensionPrecise(raw, unit) {
    const str = String(raw || '').trim();
    if (!str) return NaN;

    if (typeof window !== 'undefined' && window.CADParser && window.CADParser.parse) {
      const res = window.CADParser.parse(str, unit);
      if (res && isFinite(res.inches)) {
        const factor = window.CADParser.fromInches[unit];
        return res.inches * (factor === undefined ? 1 : factor);
      }
    }

    return this.parseSingleDimension(str, unit);
  },

  // Converts a single value string (plain, fraction, CAD expression or
  // composite "a × b") from one unit to another.
  convertValueString(raw, fromUnit, toUnit) {
    const str = String(raw || '').trim();
    if (!str || !fromUnit || !toUnit || fromUnit === toUnit) return str;

    if (str.includes('×') || str.search(/\s+[xX]\s+/) !== -1) {
      return str.split(/\s*[×xX]\s*/).map(part => {
        const num = this.parseDimensionPrecise(part.trim(), fromUnit);
        if (isNaN(num)) return part.trim();
        return this.formatLinear(this.convertLinear(num, fromUnit, toUnit), toUnit);
      }).join(' × ');
    }

    const num = this.parseDimensionPrecise(str, fromUnit);
    if (isNaN(num)) return str;
    return this.formatLinear(this.convertLinear(num, fromUnit, toUnit), toUnit);
  },

  // Resolves an item for display in the requested common unit. Area and volume
  // scale by the square / cube of the linear conversion factor.
  getDisplayItem(item, commonUnit) {
    const geom = this.getItemGeometry(item);
    const fromUnit = item.unit || '';

    if (!commonUnit || !fromUnit || commonUnit === fromUnit) {
      return {
        value: item.value,
        unit: fromUnit,
        area: geom.area,
        volume: geom.volume,
        converted: false
      };
    }

    const fromFactor = this.unitFactors[fromUnit];
    const toFactor = this.unitFactors[commonUnit];
    const ratio = (fromFactor !== undefined && toFactor !== undefined) ? fromFactor / toFactor : 1;

    return {
      value: this.convertValueString(item.value, fromUnit, commonUnit),
      unit: commonUnit,
      area: geom.area !== null ? geom.area * ratio * ratio : null,
      volume: geom.volume !== null ? geom.volume * ratio * ratio * ratio : null,
      converted: true
    };
  },

  /**
   * Builds the HTML DOM structure for the printable sheet (both preview & print)
   */
  renderPrintDOM(project, items, sketchDataUrl, options = {}) {
    const defaultOptions = {
      title: project.title ? `MEASUREMENT SHEET: ${project.title.toUpperCase()}` : 'MEASUREMENT SPECIFICATION SHEET',
      client: project.client || 'General',
      date: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
      includeSketch: !!sketchDataUrl,
      includeSignature: true,
      compact: true,
      includeArea: true,
      includeVolume: true,
      includeCategories: true,
      includeNotes: true,
      companyName: '',
      companyContact: '',
      companyLogo: null
    };
    const opts = { ...defaultOptions, ...options };
    if (opts.includeAreaVolume !== undefined) {
      if (options.includeArea === undefined) opts.includeArea = !!opts.includeAreaVolume;
      if (options.includeVolume === undefined) opts.includeVolume = !!opts.includeAreaVolume;
    }

    const incArea = !!opts.includeArea;
    const incVolume = !!opts.includeVolume;
    const incCategories = (opts.includeCategories !== undefined) ? !!opts.includeCategories : true;
    const incNotes = (opts.includeNotes !== undefined) ? !!opts.includeNotes : true;

    const totalItems = items.length;
    const verifiedCount = items.filter(i => i.verified).length;
    const commonUnit = opts.commonUnit || '';
    const displayItems = items.map(item => this.getDisplayItem(item, commonUnit));
    
    // Group categories
    const categories = [...new Set(items.map(i => i.category || 'General'))];

    // Compute totals for area and volume by unit (in the display unit)
    const areaByUnit = {};
    const volByUnit = {};
    displayItems.forEach(display => {
      const u = display.unit || 'unit';
      if (display.area !== null) {
        areaByUnit[u] = (areaByUnit[u] || 0) + display.area;
      }
      if (display.volume !== null) {
        volByUnit[u] = (volByUnit[u] || 0) + display.volume;
      }
    });

    const areaTotalStrs = Object.entries(areaByUnit).map(
      ([u, val]) => `${this.formatNumber(val)} ${u}²`
    );
    const volTotalStrs = Object.entries(volByUnit).map(
      ([u, val]) => `${this.formatNumber(val)} ${u}³`
    );

    let rowsHtml = '';
    items.forEach((item, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const verifiedTag = item.verified ? ' [✓]' : '';
      const display = displayItems[idx];
      const unit = display.unit || '';

      const areaCell = incArea ? `
        <td class="print-val-cell print-area-cell">
          ${display.area !== null ? `${this.formatNumber(display.area)} <span class="print-unit-mini">${this.escapeHtml(unit)}²</span>` : '<span class="print-na">—</span>'}
        </td>
      ` : '';

      const volCell = incVolume ? `
        <td class="print-val-cell print-vol-cell">
          ${display.volume !== null ? `${this.formatNumber(display.volume)} <span class="print-unit-mini">${this.escapeHtml(unit)}³</span>` : '<span class="print-na">—</span>'}
        </td>
      ` : '';

      const catCell = incCategories ? `
        <td style="color: #475569;">${this.escapeHtml(item.category || '—')}</td>
      ` : '';

      const notesCell = incNotes ? `
        <td style="color: #64748b; font-size: 7pt;">${this.escapeHtml(item.notes || '—')}</td>
      ` : '';

      rowsHtml += `
        <tr>
          <td style="text-align: center; color: #64748b; font-weight: 600;">${num}</td>
          <td>
            <strong>${this.escapeHtml(item.label)}</strong>
            ${verifiedTag ? '<span style="color:#10b981;font-size:6.5pt;margin-left:4px;font-weight:700;">VERIFIED</span>' : ''}
          </td>
          <td class="print-val-cell">${this.escapeHtml(display.value)}</td>
          <td class="print-unit-cell">${this.escapeHtml(unit)}</td>
          ${areaCell}
          ${volCell}
          ${catCell}
          ${notesCell}
        </tr>
      `;
    });

    const totalCols = 4 + (incArea ? 1 : 0) + (incVolume ? 1 : 0) + (incCategories ? 1 : 0) + (incNotes ? 1 : 0);
    if (items.length === 0) {
      rowsHtml = `<tr><td colspan="${totalCols}" style="text-align:center;padding:16px;color:#94a3b8;">No measurement records added yet</td></tr>`;
    }

    const sketchHtml = (opts.includeSketch && sketchDataUrl) ? `
      <div class="print-sketch-column">
        <div class="print-sketch-title">Diagram / Visual Note</div>
        <img class="print-sketch-img" src="${sketchDataUrl}" alt="Measurement Diagram" />
      </div>
    ` : '';

    const hasCompany = !!(opts.companyName || opts.companyLogo);
    const companyHeaderHtml = hasCompany ? `
      <div class="print-company-bar">
        ${opts.companyLogo ? `<img class="print-company-logo" src="${opts.companyLogo}" alt="Logo" />` : ''}
        <div class="print-company-text">
          ${opts.companyName ? `<div class="print-company-name">${this.escapeHtml(opts.companyName)}</div>` : ''}
          ${opts.companyContact ? `<div class="print-company-contact">${this.escapeHtml(opts.companyContact)}</div>` : ''}
        </div>
      </div>
    ` : '';

    let totalsExtraHtml = '';
    if ((incArea && areaTotalStrs.length > 0) || (incVolume && volTotalStrs.length > 0)) {
      totalsExtraHtml = `
        <div class="print-geom-totals" style="margin-top: 2px; font-weight: 700; display: flex; flex-wrap: wrap; gap: 8px;">
          ${incArea && areaTotalStrs.length > 0 ? `<span style="color: #0284c7;">📐 Total Area: ${areaTotalStrs.join(', ')}</span>` : ''}
          ${incVolume && volTotalStrs.length > 0 ? `<span style="color: #b45309;">📦 Total Vol: ${volTotalStrs.join(', ')}</span>` : ''}
        </div>
      `;
    }

    const html = `
      <div class="print-sheet-frame ${opts.compact !== false ? 'is-compact' : ''}">
        ${companyHeaderHtml}

        <div class="print-page-header">
          <div class="print-header-main">
            <div class="print-main-title">${this.escapeHtml(opts.title)}</div>
            <div class="print-sub-title">Project: <strong>${this.escapeHtml(project.title)}</strong></div>
          </div>
          <div class="print-header-meta">
            <div class="print-date-tag">Date: ${opts.date}</div>
          </div>
        </div>

        <div class="print-meta-grid">
          <div class="print-meta-item">
            <div class="print-meta-label">Client / Location</div>
            <div class="print-meta-val">${this.escapeHtml(opts.client || 'General')}</div>
          </div>
          <div class="print-meta-item">
            <div class="print-meta-label">Date</div>
            <div class="print-meta-val">${opts.date}</div>
          </div>
          <div class="print-meta-item">
            <div class="print-meta-label">Total Records</div>
            <div class="print-meta-val">${totalItems} Items</div>
          </div>
          ${incCategories ? `
          <div class="print-meta-item">
            <div class="print-meta-label">Categories</div>
            <div class="print-meta-val">${categories.length} Groups</div>
          </div>` : ''}
        </div>

        <div class="print-content-columns">
          <div class="print-table-column">
            <table class="print-table">
              <thead>
                <tr>
                  <th style="width: 26px; text-align: center;">#</th>
                  <th>Item / Dimension</th>
                  <th style="width: ${(incArea || incVolume) ? '70px' : '75px'}; text-align: right;">Value</th>
                  <th style="width: 38px; text-align: center;">Unit</th>
                  ${incArea ? `<th style="width: 68px; text-align: right;">Area</th>` : ''}
                  ${incVolume ? `<th style="width: 68px; text-align: right;">Volume</th>` : ''}
                  ${incCategories ? `<th style="width: ${(incArea || incVolume) ? '65px' : '75px'};">Category</th>` : ''}
                  ${incNotes ? `<th>Notes / Specs</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
          ${sketchHtml}
        </div>

        ${(totalsExtraHtml || opts.includeSignature) ? `
        <div class="print-summary-box">
          <div class="print-totals">
            ${totalsExtraHtml}
          </div>
          ${opts.includeSignature ? `
          <div class="print-signature-block">
            <div class="print-sign-line">Measured By / Date</div>
            <div class="print-sign-line">Approved / Customer</div>
          </div>` : ''}
        </div>` : ''}
      </div>
    `;

    return html;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Generates a valid pure-JavaScript PDF 1.4 binary file Blob
   */
  generatePDFBinary(project, items, options = {}) {
    // Basic PDF 1.4 A4 dimensions: 595.28 x 841.89 pt
    const width = 595.28;
    const height = 841.89;
    const margin = 36; // 0.5 inch margin

    const lines = [];
    const sanitize = (text) => {
      if (!text) return '';
      let str = String(text);

      // The built-in PDF fonts use a single-byte encoding, so non-ASCII
      // characters would corrupt both the visible text and the byte offsets
      // in the xref table. Normalize common measurement glyphs to ASCII first.
      const replacements = [
        [/[×✕✖]/g, 'x'],
        [/÷/g, '/'],
        [/¼/g, '1/4'],
        [/½/g, '1/2'],
        [/¾/g, '3/4'],
        [/⅛/g, '1/8'],
        [/⅜/g, '3/8'],
        [/⅝/g, '5/8'],
        [/⅞/g, '7/8'],
        [/[’‘]/g, "'"],
        [/[“”]/g, '"'],
        [/[–—]/g, '-'],
        [/…/g, '...'],
        [/²/g, '2'],
        [/³/g, '3'],
        [/°/g, ' deg'],
        [/•/g, '*'],
        [/✓/g, '[x]'],
        [/→/g, '->'],
        [/←/g, '<-'],
        [/≈/g, '~'],
        [/±/g, '+/-'],
        [/µ/g, 'u'],
        [/Ω/g, 'ohm']
      ];
      replacements.forEach(([pattern, value]) => {
        str = str.replace(pattern, value);
      });

      // Strip accents from letters (é -> e) and replace anything still
      // outside printable ASCII so the PDF byte layout stays valid.
      str = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      str = str.replace(/[^\x20-\x7E]/g, '?');

      return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    };

    lines.push('q');

    const isCompact = options.compact !== false;

    // Outer sheet border frame (reduced to delicate 0.5pt hairline)
    const framePad = 16;
    lines.push(`0.88 0.90 0.94 RG 0.5 w ${framePad} ${framePad} ${width - framePad * 2} ${height - framePad * 2} re s`);

    let currentTop = height - (isCompact ? 36 : 40);

    // Optional Company Branding Line
    if (options.companyName) {
      lines.push(`0.05 0.09 0.16 rg`);
      lines.push(`BT /F2 10 Tf ${margin} ${currentTop} Td (${sanitize(options.companyName.toUpperCase())}) Tj ET`);
      if (options.companyContact) {
        lines.push(`0.4 0.45 0.5 rg`);
        lines.push(`BT /F1 8 Tf ${width - margin - 200} ${currentTop} Td (${sanitize(options.companyContact)}) Tj ET`);
      }
      currentTop -= 18;
    }

    // Top banner border (reduced to clean 0.75pt divider)
    lines.push(`0.85 0.88 0.92 RG 0.75 w`);
    lines.push(`${margin} ${currentTop - 10} m ${width - margin} ${currentTop - 10} l S`);
    
    // Title
    const titleSize = isCompact ? 13 : 15;
    lines.push(`BT /F2 ${titleSize} Tf ${margin} ${currentTop} Td (${sanitize(options.title || 'MEASUREMENT SPECIFICATION SHEET')}) Tj ET`);
    lines.push(`BT /F1 8.5 Tf ${margin} ${currentTop - (isCompact ? 14 : 18)} Td (Project: ${sanitize(project.title)}) Tj ET`);
    
    const dateStr = options.date || new Date().toLocaleDateString();
    lines.push(`BT /F2 8.5 Tf ${width - margin - 120} ${currentTop} Td (DATE: ${sanitize(dateStr)}) Tj ET`);
    lines.push(`BT /F1 8 Tf ${width - margin - 120} ${currentTop - 12} Td (Client: ${sanitize(options.client || project.client || 'General')}) Tj ET`);

    // Meta box (Stats section)
    const metaBoxHeight = isCompact ? 18 : 24;
    const metaY = currentTop - (isCompact ? 36 : 50);
    lines.push(`0.95 0.96 0.98 rg ${margin} ${metaY} ${width - margin * 2} ${metaBoxHeight} re f`);
    lines.push(`0.88 0.90 0.94 RG 0.5 w ${margin} ${metaY} ${width - margin * 2} ${metaBoxHeight} re s`);
    const metaTextOffset = isCompact ? 5 : 8;
    lines.push(`BT /F2 7.5 Tf ${margin + 12} ${metaY + metaTextOffset} Td (CLIENT: ${sanitize(options.client || project.client || 'General')}) Tj ET`);
    lines.push(`BT /F2 7.5 Tf ${margin + 200} ${metaY + metaTextOffset} Td (TOTAL RECORDS: ${items.length} Items) Tj ET`);
    lines.push(`BT /F2 7.5 Tf ${width - margin - 110} ${metaY + metaTextOffset} Td (DATE: ${sanitize(dateStr)}) Tj ET`);

    const incArea = (options.includeArea !== undefined) ? !!options.includeArea : (options.includeAreaVolume !== undefined ? !!options.includeAreaVolume : false);
    const incVol = (options.includeVolume !== undefined) ? !!options.includeVolume : (options.includeAreaVolume !== undefined ? !!options.includeAreaVolume : false);
    const incCategories = (options.includeCategories !== undefined) ? !!options.includeCategories : true;
    const incNotes = (options.includeNotes !== undefined) ? !!options.includeNotes : true;
    const commonUnit = options.commonUnit || '';
    const displayItems = items.map(item => this.getDisplayItem(item, commonUnit));

    // Dynamic column layout
    const totalTableWidth = width - margin * 2;
    const wNum = 20;
    const wVal = (incArea || incVol) ? 58 : 68;
    const wUnit = 30;
    const wArea = incArea ? 60 : 0;
    const wVol = incVol ? 60 : 0;
    const wCat = incCategories ? ((incArea && incVol) ? 56 : 68) : 0;

    const fixedW = wNum + wVal + wUnit + wArea + wVol + wCat;
    const remW = Math.max(80, totalTableWidth - fixedW);
    let wNotes = 0;
    let wLabel = remW;
    if (incNotes) {
      wNotes = Math.min(130, Math.max(65, Math.floor(remW * 0.36)));
      wLabel = remW - wNotes;
    }

    const colX = {
      num: margin + 5,
      label: margin + wNum + 3,
      val: margin + wNum + wLabel,
      unit: margin + wNum + wLabel + wVal,
      area: incArea ? (margin + wNum + wLabel + wVal + wUnit) : 0,
      vol: incVol ? (margin + wNum + wLabel + wVal + wUnit + wArea) : 0,
      cat: incCategories ? (margin + wNum + wLabel + wVal + wUnit + wArea + wVol) : 0,
      notes: incNotes ? (margin + wNum + wLabel + wVal + wUnit + wArea + wVol + wCat) : 0
    };

    // Table Header
    const tableHeaderHeight = isCompact ? 16 : 18;
    let tableY = metaY - (isCompact ? 18 : 24);
    lines.push(`0.08 0.12 0.20 rg ${margin} ${tableY - tableHeaderHeight} ${width - margin * 2} ${tableHeaderHeight} re f`);
    lines.push(`1 1 1 rg`); // White text
    const thTextY = tableY - (isCompact ? 11 : 13);
    lines.push(`BT /F2 7.5 Tf ${colX.num} ${thTextY} Td (#) Tj ET`);
    lines.push(`BT /F2 7.5 Tf ${colX.label} ${thTextY} Td (DIMENSION / ITEM) Tj ET`);
    lines.push(`BT /F2 7.5 Tf ${colX.val} ${thTextY} Td (VALUE) Tj ET`);
    lines.push(`BT /F2 7.5 Tf ${colX.unit} ${thTextY} Td (UNIT) Tj ET`);
    if (incArea) {
      lines.push(`BT /F2 7.5 Tf ${colX.area} ${thTextY} Td (AREA) Tj ET`);
    }
    if (incVol) {
      lines.push(`BT /F2 7.5 Tf ${colX.vol} ${thTextY} Td (VOLUME) Tj ET`);
    }
    if (incCategories) {
      lines.push(`BT /F2 7.5 Tf ${colX.cat} ${thTextY} Td (CATEGORY) Tj ET`);
    }
    if (incNotes) {
      lines.push(`BT /F2 7.5 Tf ${colX.notes} ${thTextY} Td (NOTES) Tj ET`);
    }

    tableY -= tableHeaderHeight;
    const rowHeight = isCompact ? 15 : 20;

    const maxLabelLen = Math.max(16, Math.floor(wLabel / 5.2));
    const maxCatLen = incCategories ? Math.max(10, Math.floor(wCat / 5.0)) : 0;
    const maxNotesLen = incNotes ? Math.max(12, Math.floor(wNotes / 4.8)) : 0;

    // Compute totals for area and volume by unit
    const areaByUnit = {};
    const volByUnit = {};

    items.forEach((item, idx) => {
      const display = displayItems[idx];
      const u = display.unit || 'unit';
      if (display.area !== null) {
        areaByUnit[u] = (areaByUnit[u] || 0) + display.area;
      }
      if (display.volume !== null) {
        volByUnit[u] = (volByUnit[u] || 0) + display.volume;
      }

      if (tableY < 120) return; // Prevent overflow beyond page
      const isEven = idx % 2 === 0;
      if (isEven) {
        lines.push(`0.97 0.98 0.99 rg ${margin} ${tableY - rowHeight} ${width - margin * 2} ${rowHeight} re f`);
      }
      lines.push(`0.90 0.92 0.95 RG 0.5 w ${margin} ${tableY - rowHeight} m ${width - margin} ${tableY - rowHeight} l S`);

      // Text values
      lines.push(`0 0 0 rg`); // Black text
      const num = String(idx + 1).padStart(2, '0');
      lines.push(`BT /F1 8 Tf ${colX.num} ${tableY - 14} Td (${num}) Tj ET`);
      
      const label = item.label.length > maxLabelLen ? item.label.substring(0, maxLabelLen - 2) + '..' : item.label;
      lines.push(`BT /F2 8.5 Tf ${colX.label} ${tableY - 14} Td (${sanitize(label)}) Tj ET`);
      
      // Value in bold blue
      lines.push(`0.01 0.52 0.78 rg`);
      lines.push(`BT /F2 9.5 Tf ${colX.val} ${tableY - 14} Td (${sanitize(display.value)}) Tj ET`);
      
      lines.push(`0.2 0.25 0.3 rg`);
      lines.push(`BT /F2 8 Tf ${colX.unit} ${tableY - 14} Td (${sanitize(display.unit || '')}) Tj ET`);

      if (incArea) {
        lines.push(`0.01 0.52 0.78 rg`);
        const aStr = display.area !== null ? `${this.formatNumber(display.area)} ${display.unit || ''}2` : '-';
        lines.push(`BT /F2 7.5 Tf ${colX.area} ${tableY - 14} Td (${sanitize(aStr)}) Tj ET`);
      }

      if (incVol) {
        lines.push(`0.7 0.45 0.05 rg`);
        const vStr = display.volume !== null ? `${this.formatNumber(display.volume)} ${display.unit || ''}3` : '-';
        lines.push(`BT /F2 7.5 Tf ${colX.vol} ${tableY - 14} Td (${sanitize(vStr)}) Tj ET`);
      }

      if (incCategories) {
        lines.push(`0.4 0.45 0.5 rg`);
        const cat = (item.category || 'General').substring(0, maxCatLen);
        lines.push(`BT /F1 7.5 Tf ${colX.cat} ${tableY - 14} Td (${sanitize(cat)}) Tj ET`);
      }

      if (incNotes) {
        lines.push(`0.4 0.45 0.5 rg`);
        const notes = (item.notes || '—').substring(0, maxNotesLen);
        lines.push(`BT /F1 7.5 Tf ${colX.notes} ${tableY - 14} Td (${sanitize(notes)}) Tj ET`);
      }

      tableY -= rowHeight;
    });

    const areaTotalStrs = Object.entries(areaByUnit).map(
      ([u, val]) => `${this.formatNumber(val)} ${u}2`
    );
    const volTotalStrs = Object.entries(volByUnit).map(
      ([u, val]) => `${this.formatNumber(val)} ${u}3`
    );

    // Totals line above signature
    const bottomY = 70;
    if (incArea && areaTotalStrs.length > 0) {
      lines.push(`0.01 0.52 0.78 rg`);
      lines.push(`BT /F2 7.5 Tf ${margin} ${bottomY + 40} Td (TOTAL AREA: ${sanitize(areaTotalStrs.join(', '))}) Tj ET`);
    }
    if (incVol && volTotalStrs.length > 0) {
      lines.push(`0.7 0.45 0.05 rg`);
      const vOffset = (incArea && areaTotalStrs.length > 0) ? (margin + 200) : margin;
      lines.push(`BT /F2 7.5 Tf ${vOffset} ${bottomY + 40} Td (TOTAL VOLUME: ${sanitize(volTotalStrs.join(', '))}) Tj ET`);
    }
    if (options.includeSignature !== false) {
      lines.push(`0.58 0.64 0.72 RG 0.5 w`);
      lines.push(`${margin} ${bottomY + 25} ${margin + 160} ${bottomY + 25} m ${margin + 160} ${bottomY + 25} l S`);
      lines.push(`${width - margin - 160} ${bottomY + 25} ${width - margin} ${bottomY + 25} m ${width - margin} ${bottomY + 25} l S`);

      lines.push(`0.3 0.35 0.4 rg`);
      lines.push(`BT /F1 7 Tf ${margin} ${bottomY + 14} Td (MEASURED BY / DATE) Tj ET`);
      lines.push(`BT /F1 7 Tf ${width - margin - 160} ${bottomY + 14} Td (APPROVED / SIGNATURE) Tj ET`);
    }

    lines.push('Q');

    const streamContent = lines.join('\n');
    const streamLength = streamContent.length;

    // Build standard PDF structure with xref
    let pdf = `%PDF-1.4\n`;
    const offsets = [];

    const appendObj = (objNumber, content) => {
      offsets[objNumber] = pdf.length;
      pdf += `${objNumber} 0 obj\n${content}\nendobj\n`;
    };

    appendObj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
    appendObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
    appendObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`);
    appendObj(4, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
    appendObj(5, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
    appendObj(6, `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`);

    const xrefOffset = pdf.length;
    pdf += `xref\n0 7\n0000000000 65535 f \n`;
    for (let i = 1; i <= 6; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      pdf += `${offStr} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  },

  generatePDFBlob(project, items, options = {}) {
    return this.generatePDFBinary(project, items, options);
  },

  downloadPDF(project, items, options = {}) {
    const blob = this.generatePDFBinary(project, items, options);
    const fileName = `${(project.title || 'measurements').toLowerCase().replace(/[^a-z0-9]/g, '-')}-notes.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /**
   * Generates standard RFC 4180 CSV with UTF-8 BOM for Excel / Google Sheets
   */
  generateCSV(project, items, options = {}) {
    const incArea = (options.includeArea !== undefined) ? !!options.includeArea : (options.includeAreaVolume !== undefined ? !!options.includeAreaVolume : false);
    const incVolume = (options.includeVolume !== undefined) ? !!options.includeVolume : (options.includeAreaVolume !== undefined ? !!options.includeAreaVolume : false);
    const incCategories = (options.includeCategories !== undefined) ? !!options.includeCategories : true;
    const incNotes = (options.includeNotes !== undefined) ? !!options.includeNotes : true;

    const sanitizeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = ['#', 'Item / Dimension', 'Value', 'Unit'];
    if (incArea) header.push('Area');
    if (incVolume) header.push('Volume');
    if (incCategories) header.push('Category');
    header.push('Verified');
    if (incNotes) header.push('Notes');

    const metaRow = [
      `# PROJECT: ${project.title || 'Measurement Sheet'}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ...Array(Math.max(0, header.length - 2)).fill('')
    ];
    const lines = [
      metaRow.map(sanitizeCsv).join(','),
      header.map(sanitizeCsv).join(',')
    ];

    items.forEach((item, idx) => {
      const geom = this.getItemGeometry(item);
      const row = [
        idx + 1,
        item.label || '',
        item.value || '',
        item.unit || ''
      ];
      if (incArea) {
        row.push(geom.area !== null ? `${Math.round(geom.area * 100) / 100} ${item.unit || ''}²` : '');
      }
      if (incVolume) {
        row.push(geom.volume !== null ? `${Math.round(geom.volume * 100) / 100} ${item.unit || ''}³` : '');
      }
      if (incCategories) {
        row.push(item.category || '');
      }
      row.push(item.verified ? 'YES' : 'NO');
      if (incNotes) {
        row.push(item.notes || '');
      }
      lines.push(row.map(sanitizeCsv).join(','));
    });

    const csvText = '\uFEFF' + lines.join('\r\n');
    return new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  },

  downloadCSV(project, items, options = {}) {
    const blob = this.generateCSV(project, items, options);
    const fileName = `${(project.title || 'measurements').toLowerCase().replace(/[^a-z0-9]/g, '-')}-data.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /**
   * Parses RFC 4180 compliant CSV text into structured measurement item objects.
   * Handles BOM, escaped quotes, embedded commas, multiline values, metadata comments,
   * header detection, and unit normalisation.
   */
  parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    // Strip UTF-8 BOM if present
    let text = csvText.replace(/^\uFEFF/, '').trim();
    if (!text) return [];

    // Detect delimiter: comma or semicolon (common in European Excel exports)
    let delimiter = ',';
    const firstLine = text.split(/\r?\n/).find(l => l.trim() && !l.trim().startsWith('#')) || '';
    let commaCount = 0;
    let semiCount = 0;
    let inQ = false;
    for (let i = 0; i < firstLine.length; i++) {
      const c = firstLine[i];
      if (c === '"') inQ = !inQ;
      else if (!inQ && c === ',') commaCount++;
      else if (!inQ && c === ';') semiCount++;
    }
    if (semiCount > commaCount) {
      delimiter = ';';
    }

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n in CRLF
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    // Filter out comment / metadata rows starting with '# ' or '#PROJECT' (preserving header columns like '#')
    const validRows = rows.filter(r => {
      if (!r || r.length === 0 || !r[0]) return false;
      const first = r[0].trim();
      return !(first.startsWith('# ') || (first.startsWith('#') && first.includes(':')) || first.toLowerCase().startsWith('#project'));
    });
    if (validRows.length === 0) return [];

    // Identify header row
    let headerIndex = -1;
    const colIndices = {
      label: -1,
      value: -1,
      unit: -1,
      category: -1,
      notes: -1,
      verified: -1
    };

    for (let r = 0; r < Math.min(validRows.length, 5); r++) {
      const rowLower = validRows[r].map(c => c.toLowerCase());
      const hasLabel = rowLower.some(c => c.includes('item') || c.includes('name') || c.includes('label') || c.includes('desc') || c === 'title');
      const hasVal = rowLower.some(c => c.includes('val') || c.includes('size') || c.includes('meas') || c.includes('len') || c.includes('dim'));

      if (hasLabel || hasVal) {
        headerIndex = r;
        rowLower.forEach((cell, idx) => {
          if (cell.includes('item') || cell.includes('name') || cell.includes('label') || cell.includes('desc') || cell === 'title') {
            if (colIndices.label === -1) colIndices.label = idx;
          } else if (cell.includes('val') || cell.includes('size') || cell.includes('meas') || cell.includes('len') || cell.includes('dim')) {
            if (colIndices.value === -1) colIndices.value = idx;
          } else if (cell.includes('unit') || cell === 'uom') {
            if (colIndices.unit === -1) colIndices.unit = idx;
          } else if (cell.includes('cat') || cell.includes('group') || cell.includes('type') || cell.includes('room') || cell.includes('tag')) {
            if (colIndices.category === -1) colIndices.category = idx;
          } else if (cell.includes('note') || cell.includes('comment') || cell.includes('remark')) {
            if (colIndices.notes === -1) colIndices.notes = idx;
          } else if (cell.includes('veri') || cell.includes('check') || cell.includes('status')) {
            if (colIndices.verified === -1) colIndices.verified = idx;
          }
        });
        break;
      }
    }

    const dataRows = (headerIndex >= 0) ? validRows.slice(headerIndex + 1) : validRows;
    const parsedItems = [];
    const knownUnits = ['mm', 'cm', 'm', 'in', 'ft', 'yd'];

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      let label = '';
      let value = '';
      let unit = 'cm';
      let category = 'General';
      let notes = '';
      let verified = false;

      if (headerIndex >= 0) {
        if (colIndices.label >= 0 && row[colIndices.label]) label = row[colIndices.label];
        if (colIndices.value >= 0 && row[colIndices.value]) value = row[colIndices.value];
        if (colIndices.unit >= 0 && row[colIndices.unit]) unit = row[colIndices.unit];
        if (colIndices.category >= 0 && row[colIndices.category]) category = row[colIndices.category];
        if (colIndices.notes >= 0 && row[colIndices.notes]) notes = row[colIndices.notes];
        if (colIndices.verified >= 0 && row[colIndices.verified]) {
          const v = String(row[colIndices.verified]).trim().toLowerCase();
          verified = (v === 'yes' || v === 'true' || v === '1' || v === 'y' || v === 'verified');
        }
      } else {
        // Positional fallback:
        // Case A: [# or Index, Label, Value, Unit, ...]
        if (row.length >= 4 && !isNaN(Number(row[0])) && isNaN(Number(row[1]))) {
          label = row[1];
          value = row[2];
          unit = row[3] || 'cm';
          if (row[4]) category = row[4];
          if (row[5]) notes = row[5];
        } else if (row.length >= 2) {
          // Case B: [Label, Value, Unit, Category, Notes]
          label = row[0];
          value = row[1];
          if (row[2]) unit = row[2];
          if (row[3]) category = row[3];
          if (row[4]) notes = row[4];
        }
      }

      label = String(label || '').trim();
      value = String(value || '').trim();
      unit = String(unit || 'cm').trim();
      category = String(category || 'General').trim();
      notes = String(notes || '').trim();

      // Normalize unit or extract unit embedded in value (e.g. "180 x 90 cm" or "120 mm")
      const match = value.match(/^([\d\s.xX×\/\-+]+)\s*([a-zA-Z]+)$/);
      if (match && knownUnits.includes(match[2].toLowerCase())) {
        value = match[1].trim();
        unit = match[2].toLowerCase();
      } else if (knownUnits.includes(unit.toLowerCase())) {
        unit = unit.toLowerCase();
      } else {
        unit = 'cm';
      }

      if (!label && value) {
        label = `Item ${parsedItems.length + 1}`;
      }

      if (label && value) {
        parsedItems.push({
          label,
          value,
          unit,
          category,
          notes,
          verified
        });
      }
    }

    return parsedItems;
  }
};

window.PDFGenerator = PDFGenerator;
