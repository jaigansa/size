# 📐 SizeNotes — Mobile Measurement App

A mobile web application designed for rapid on-site measurement notes, photo annotation, and printing formatted single-page PDF reports. Built specifically with a **single-screen architecture (zero tabs, pure popups)**.

---

## ✨ Features

- **📱 Single Screen Architecture & 5 Pro Color Themes**:
  - No bottom navigation tabs, zero top tabs.
  - Every secondary action, editor, sketchpad, template, and export function is handled through native-feeling **slide-up popups and modals**.
  - **🎨 Live Color Themes & Sunlight Outdoor Mode**:
    - **Obsidian Azure**: Modern OLED deep black with electric cyan accents.
    - **Blueprint Tech**: Architect drafting deep navy with technical blue.
    - **Workshop Amber**: Industrial charcoal with carpenter gold.
    - **Emerald Craft**: Forest dark green with mint precision.
    - **Sunlight Paper**: 100% high-contrast daylight mode for outdoor on-site measuring under direct sunlight.

- **📏 Fast On-Site Measurement Notes**:
  - **Unified Search & Category Selector**: The category filter is integrated directly inside the search bar as a dropdown list with live item counts, freeing up vertical screen space.
  - **Multi-Dimension 2D & 3D Modes**: Switch between 1D (single value), 2D ($L \times W$), and 3D ($L \times W \times H$) with instant live area and volume calculations.
  - **↕️ Item Reordering**: Dedicated up/down controls on every card to order measurements logically.
  - Quick dimension suggestions (*Length, Width, Height, Depth, Thickness, Waist, Chest, Inseam*).
  - Multi-unit support: `cm`, `in` (inches), `mm`, `m`, `ft` (feet), `yd` (yards).
  - Quick fraction & step adjustments (`+1`, `-1`, `+0.5`, `¼`, `½`, `¾`).
  - **"Save & Next"** button for rapid consecutive data entry on touch screens.
  - Verification checkmark toggle (`[✓] Verified`) for tracking checked items on site.
  - Categorization with color tags and real-time category filtering.
  - **↩️ Undo Toast**: Restore deleted items immediately with a 1-tap Undo button.

- **📄 Single-Page PDF Print, Share & CSV Export**:
  - **📲 Native Mobile Share (`navigator.share`)**: Instantly share the generated PDF and summary directly to WhatsApp, Messages, AirDrop, or Gmail on mobile devices.
  - **📊 CSV / Excel Cut-List Export**: Download clean RFC 4180 UTF-8 CSV cut lists for spreadsheets, CNC routers, or cutting software.
  - **🏢 Contractor & Company Branding**: Add company name, license line, and logo to embed directly into PDF reports.
  - **Native Print Page**: Triggers browser/mobile print dialog formatted with CSS `@media print` rules specifically styled for clean, high-contrast, single-page A4/Letter printing.
  - **Standalone .PDF Download**: Generates standard PDF 1.4 binary documents offline using a pure client-side PDF generator (no external network or CDNs required).
  - **Text Summary Copy**: Instant clipboard copy formatted for quick sharing via WhatsApp, SMS, or Slack.
  - Configurable title, client reference, signature block, and date.

- **✏️ Touch Diagram, Photo Backdrop & Sketch Pad**:
  - **📸 Photo Backdrop**: Snap or select a real-world photo as canvas background, then draw dimension lines, arrows (`<--->`), and shapes directly over the picture.
  - **🔤 Text & Dimension Stamp**: Tap to place crisp, high-contrast measurement labels (e.g. `142 cm`, `Clearance`) anywhere on the canvas.
  - Saved diagrams automatically embed directly into the printed PDF sheet!

- **⚡ Starter Presets & Custom Templates**:
  - **⭐ "Save Current Sheet as Template"**: Save custom recurring dimension checklists to reuse anytime.
  - *Room & Interior Architecture* (Wall Length, Wall Width, Ceiling Height, Window/Door openings)
  - *Tailoring & Apparel* (Chest, Waist, Hips, Shoulder, Sleeve, Inseam, Neck)
  - *Carpentry & Woodworking* (Cut lengths, Board thickness, Leg height, Kerf)
  - *Box & Shipping* (Outer dimensions, Clearance, Volume, Weight)

- **🧮 Converter, Calculator & Project Unit Batching**:
  - **🔄 Project Sheet Batch Conversion**: 1-tap conversion of all measurements in the sheet to a target unit (`cm`, `in`, `mm`, `m`, `ft`, `yd`).
  - Live unit conversion between mm, cm, m, inches, feet, and fractional representations.
  - Instant Area ($L \times W$), Perimeter ($2(L+W)$), and Volume ($L \times W \times H$) calculator.

- **📁 Multiple Project Sheets**:
  - Create, switch, duplicate, and delete measurement projects.
  - Export and import full JSON backups (including custom templates and company branding).

- **📲 Progressive Web App (PWA) & Offline Ready**:
  - Includes `manifest.json` and `sw.js` (Service Worker) for 100% offline usage and "Add to Home Screen" installation.

---

## 🚀 How to Run

### Option 1: Run Local Server (Best for Mobile Testing)
Run the included Python server to access the app on your computer and directly on your smartphone over the same Wi-Fi network:

```bash
python3 server.py
```

The terminal will display:
- **Computer**: `http://localhost:8080`
- **Phone (same Wi-Fi)**: `http://<your-local-ip>:8080`

Open that URL on your phone's browser (Safari on iOS or Chrome on Android) and tap **"Add to Home Screen"** to use it as a native mobile app!

### Option 2: Open Directly in Browser
You can also open `index.html` directly in any web browser without a server:
```bash
xdg-open index.html
```

---

## 🖨️ Printing, Sharing or Saving PDF on Mobile

1. Tap **"PDF"** (top header button or bottom action bar).
2. Tap **"Share"** to open the native mobile share sheet (WhatsApp, AirDrop, Messages, etc.).
3. Tap **"CSV"** to download an Excel-ready cut-list table.
4. Tap **"Print"** to trigger the system print dialog (Save as PDF on Android / pinch-out on iOS).
5. Tap **"PDF"** to directly download the binary `.pdf` file offline.
