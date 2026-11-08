/**
 * SizeNotes - PDF & CSV Generator Module
 * Provides:
 * 1. Print page DOM generation for native high-res window.print() (Save as PDF)
 * 2. Standalone pure JS PDF 1.4 binary generator for direct .pdf file download & sharing
 * 3. Excel-compatible CSV export for cut lists and CAD/spreadsheet pipelines
 */

const PDFGenerator = {
  /**
   * Builds the HTML DOM structure for the printable sheet (both preview & print)
   */
  renderPrintDOM(project, items, sketchDataUrl, options = {}) {
    const defaultOptions = {
      title: project.title || 'Measurement Specification Sheet',
      client: project.client || 'General',
      date: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
      includeSketch: !!sketchDataUrl,
      includeSignature: true,
      compact: false,
      companyName: '',
      companyContact: '',
      companyLogo: null
    };
    const opts = { ...defaultOptions, ...options };

    const totalItems = items.length;
    const verifiedCount = items.filter(i => i.verified).length;
    
    // Group categories
    const categories = [...new Set(items.map(i => i.category || 'General'))];

    let rowsHtml = '';
    items.forEach((item, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const verifiedTag = item.verified ? ' [✓]' : '';
      rowsHtml += `
        <tr>
          <td style="text-align: center; color: #64748b; font-weight: 600;">${num}</td>
          <td>
            <strong>${this.escapeHtml(item.label)}</strong>
            ${verifiedTag ? '<span style="color:#10b981;font-size:7pt;margin-left:4px;">VERIFIED</span>' : ''}
          </td>
          <td class="print-val-cell">${this.escapeHtml(item.value)}</td>
          <td class="print-unit-cell">${this.escapeHtml(item.unit || '')}</td>
          <td style="color: #475569;">${this.escapeHtml(item.category || '—')}</td>
          <td style="color: #64748b; font-size: 7.5pt;">${this.escapeHtml(item.notes || '—')}</td>
        </tr>
      `;
    });

    if (items.length === 0) {
      rowsHtml = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">No measurement records added yet</td></tr>`;
    }

    const sketchHtml = (opts.includeSketch && sketchDataUrl) ? `
      <div class="print-sketch-column">
        <div class="print-sketch-title">Diagram / Visual Note</div>
        <img class="print-sketch-img" src="${sketchDataUrl}" alt="Measurement Diagram" />
      </div>
    ` : '';

    const companyHeaderHtml = (opts.companyName || opts.companyLogo) ? `
      <div class="print-company-bar">
        ${opts.companyLogo ? `<img class="print-company-logo" src="${opts.companyLogo}" alt="Logo" />` : ''}
        <div>
          ${opts.companyName ? `<div class="print-company-name">${this.escapeHtml(opts.companyName)}</div>` : ''}
          ${opts.companyContact ? `<div class="print-company-contact">${this.escapeHtml(opts.companyContact)}</div>` : ''}
        </div>
      </div>
    ` : '';

    const html = `
      <div class="print-sheet-frame">
        ${companyHeaderHtml}

        <div class="print-page-header">
          <div>
            <div class="print-main-title">${this.escapeHtml(opts.title)}</div>
            <div class="print-sub-title">Project: <strong>${this.escapeHtml(project.title)}</strong> &bull; Ref: ${this.escapeHtml(project.id.slice(-6).toUpperCase())}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 8pt; font-weight: 700; color: #0284c7;">SIZENOTE REPORT</div>
            <div style="font-size: 7.5pt; color: #64748b;">Generated: ${opts.date}</div>
          </div>
        </div>

        <div class="print-meta-grid">
          <div class="print-meta-item">
            <div class="print-meta-label">Client / Location</div>
            <div class="print-meta-val">${this.escapeHtml(opts.client || 'N/A')}</div>
          </div>
          <div class="print-meta-item">
            <div class="print-meta-label">Total Items</div>
            <div class="print-meta-val">${totalItems} Recorded</div>
          </div>
          <div class="print-meta-item">
            <div class="print-meta-label">Verification</div>
            <div class="print-meta-val">${verifiedCount} / ${totalItems} Checked</div>
          </div>
          <div class="print-meta-item">
            <div class="print-meta-label">Categories</div>
            <div class="print-meta-val">${categories.length} Groups</div>
          </div>
        </div>

        <div class="print-content-columns">
          <div class="print-table-column">
            <table class="print-table">
              <thead>
                <tr>
                  <th style="width: 32px; text-align: center;">#</th>
                  <th>Item / Dimension</th>
                  <th style="width: 80px; text-align: right;">Value</th>
                  <th style="width: 45px; text-align: center;">Unit</th>
                  <th style="width: 80px;">Category</th>
                  <th>Notes / Specs</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
          ${sketchHtml}
        </div>

        <div class="print-summary-box">
          <div class="print-totals">
            <div><strong>Notes:</strong> All measurements subject to on-site tolerances. Confirm critical clear-spaces prior to cutting.</div>
            <div style="color: #64748b; font-size: 7pt; margin-top: 2px;">Units referenced: ${[...new Set(items.map(i => i.unit))].join(', ') || 'N/A'}</div>
          </div>
          ${opts.includeSignature ? `
          <div class="print-signature-block">
            <div class="print-sign-line">Measured By / Date</div>
            <div class="print-sign-line">Approved / Customer</div>
          </div>` : ''}
        </div>

        <div class="print-footer-tag">
          Document ID: SZN-${project.id} &bull; SizeNotes Single-Screen Measurement System
        </div>
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
      return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    };

    lines.push('q');

    // Outer architectural sheet border frame
    const framePad = 16;
    lines.push(`0.08 0.12 0.18 RG 1.2 w ${framePad} ${framePad} ${width - framePad * 2} ${height - framePad * 2} re s`);

    let currentTop = height - 40;

    // Optional Company Branding Line
    if (options.companyName) {
      lines.push(`0.05 0.09 0.16 rg`);
      lines.push(`BT /F2 11 Tf ${margin} ${currentTop} Td (${sanitize(options.companyName.toUpperCase())}) Tj ET`);
      if (options.companyContact) {
        lines.push(`0.4 0.45 0.5 rg`);
        lines.push(`BT /F1 8 Tf ${width - margin - 200} ${currentTop} Td (${sanitize(options.companyContact)}) Tj ET`);
      }
      currentTop -= 22;
    }

    // Top banner border
    lines.push(`0.05 0.09 0.16 rg`);
    lines.push(`${margin} ${currentTop - 12} ${width - margin * 2} 3 re f`);
    
    // Title
    lines.push(`BT /F2 15 Tf ${margin} ${currentTop} Td (${sanitize(options.title || 'MEASUREMENT SPECIFICATION SHEET')}) Tj ET`);
    lines.push(`BT /F1 9 Tf ${margin} ${currentTop - 18} Td (Project: ${sanitize(project.title)} | Ref: ${sanitize(project.id.slice(-6).toUpperCase())}) Tj ET`);
    
    const dateStr = options.date || new Date().toLocaleDateString();
    lines.push(`BT /F2 9 Tf ${width - margin - 120} ${currentTop} Td (DATE: ${sanitize(dateStr)}) Tj ET`);
    lines.push(`BT /F1 8 Tf ${width - margin - 120} ${currentTop - 14} Td (Client: ${sanitize(project.client || 'Standard')}) Tj ET`);

    // Meta box
    const metaY = currentTop - 50;
    lines.push(`0.95 0.96 0.98 rg ${margin} ${metaY} ${width - margin * 2} 24 re f`);
    lines.push(`0.8 0.84 0.88 RG 1 w ${margin} ${metaY} ${width - margin * 2} 24 re s`);
    lines.push(`BT /F2 8 Tf ${margin + 10} ${metaY + 8} Td (TOTAL ITEMS: ${items.length}) Tj ET`);
    const verified = items.filter(i => i.verified).length;
    lines.push(`BT /F2 8 Tf ${margin + 160} ${metaY + 8} Td (STATUS: ${verified}/${items.length} Checked) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 330} ${metaY + 8} Td (ID: SZN-${sanitize(project.id.slice(0, 8))}) Tj ET`);

    // Table Header
    let tableY = metaY - 24;
    lines.push(`0.08 0.12 0.20 rg ${margin} ${tableY - 18} ${width - margin * 2} 18 re f`);
    lines.push(`1 1 1 rg`); // White text
    lines.push(`BT /F2 8 Tf ${margin + 8} ${tableY - 13} Td (#) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 30} ${tableY - 13} Td (DIMENSION / ITEM) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 240} ${tableY - 13} Td (VALUE) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 300} ${tableY - 13} Td (UNIT) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 350} ${tableY - 13} Td (CATEGORY) Tj ET`);
    lines.push(`BT /F2 8 Tf ${margin + 430} ${tableY - 13} Td (NOTES) Tj ET`);

    tableY -= 18;
    const rowHeight = 20;

    items.forEach((item, idx) => {
      if (tableY < 120) return; // Prevent overflow beyond page
      const isEven = idx % 2 === 0;
      if (isEven) {
        lines.push(`0.97 0.98 0.99 rg ${margin} ${tableY - rowHeight} ${width - margin * 2} ${rowHeight} re f`);
      }
      lines.push(`0.88 0.90 0.93 RG 0.5 w ${margin} ${tableY - rowHeight} ${width - margin * 2} ${rowHeight} re s`);

      // Text values
      lines.push(`0 0 0 rg`); // Black text
      const num = String(idx + 1).padStart(2, '0');
      lines.push(`BT /F1 8 Tf ${margin + 8} ${tableY - 14} Td (${num}) Tj ET`);
      
      const label = item.label.length > 32 ? item.label.substring(0, 30) + '..' : item.label;
      lines.push(`BT /F2 8.5 Tf ${margin + 30} ${tableY - 14} Td (${sanitize(label)}) Tj ET`);
      
      // Value in bold blue
      lines.push(`0.01 0.52 0.78 rg`);
      lines.push(`BT /F2 9.5 Tf ${margin + 240} ${tableY - 14} Td (${sanitize(item.value)}) Tj ET`);
      
      lines.push(`0.2 0.25 0.3 rg`);
      lines.push(`BT /F2 8 Tf ${margin + 300} ${tableY - 14} Td (${sanitize(item.unit || '')}) Tj ET`);

      lines.push(`0.4 0.45 0.5 rg`);
      const cat = (item.category || 'General').substring(0, 14);
      lines.push(`BT /F1 7.5 Tf ${margin + 350} ${tableY - 14} Td (${sanitize(cat)}) Tj ET`);

      const notes = (item.notes || '—').substring(0, 20);
      lines.push(`BT /F1 7.5 Tf ${margin + 430} ${tableY - 14} Td (${sanitize(notes)}) Tj ET`);

      tableY -= rowHeight;
    });

    // Signature and Signoff lines at bottom
    const bottomY = 70;
    lines.push(`0 0 0 RG 0.75 w`);
    lines.push(`${margin} ${bottomY + 25} ${margin + 160} ${bottomY + 25} m ${margin + 160} ${bottomY + 25} l S`);
    lines.push(`${width - margin - 160} ${bottomY + 25} ${width - margin} ${bottomY + 25} m ${width - margin} ${bottomY + 25} l S`);

    lines.push(`0.3 0.35 0.4 rg`);
    lines.push(`BT /F1 7 Tf ${margin} ${bottomY + 14} Td (MEASURED BY / OPERATOR SIGNATURE) Tj ET`);
    lines.push(`BT /F1 7 Tf ${width - margin - 160} ${bottomY + 14} Td (APPROVED / CLIENT SIGNATURE) Tj ET`);

    // Footer note
    lines.push(`0.5 0.55 0.6 rg`);
    lines.push(`BT /F1 7 Tf ${margin} 30 Td (Generated by SizeNotes - Single Screen Measurement App | Page 1 of 1) Tj ET`);

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
  generateCSV(project, items) {
    const sanitizeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines = [
      [`# PROJECT: ${project.title || 'Measurement Sheet'}`, `Date: ${new Date().toLocaleDateString()}`, '', '', '', '', ''].map(sanitizeCsv).join(','),
      ['#', 'Item / Dimension', 'Value', 'Unit', 'Category', 'Verified', 'Notes'].map(sanitizeCsv).join(',')
    ];

    items.forEach((item, idx) => {
      lines.push([
        idx + 1,
        item.label || '',
        item.value || '',
        item.unit || '',
        item.category || '',
        item.verified ? 'YES' : 'NO',
        item.notes || ''
      ].map(sanitizeCsv).join(','));
    });

    const csvText = '\uFEFF' + lines.join('\r\n');
    return new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  },

  downloadCSV(project, items) {
    const blob = this.generateCSV(project, items);
    const fileName = `${(project.title || 'measurements').toLowerCase().replace(/[^a-z0-9]/g, '-')}-data.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

window.PDFGenerator = PDFGenerator;
