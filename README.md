# 📐 SizeNotes — Mobile Measurement App

A mobile application designed for taking on-site measurement notes and printing formatted single-page PDF reports. Built specifically with a **single-screen architecture (zero tabs, pure popups)**.

---

## ✨ Features

- **📱 Single Screen Architecture**:
  - No bottom navigation tabs.
  - No top tabs.
  - Every secondary action, editor, sketchpad, template, and export function is handled through native-feeling **slide-up popups and modals**.

- **📏 Fast On-Site Measurement Notes**:
  - **Unified Search & Category Selector**: The category filter is integrated directly inside the search bar as a dropdown list with live item counts, freeing up vertical screen space.
  - Quick dimension suggestions (*Length, Width, Height, Depth, Thickness, Waist, Chest, Inseam*).
  - Multi-unit support: `cm`, `in` (inches), `mm`, `m`, `ft` (feet), `yd` (yards).
  - Quick fraction & step adjustments (`+1`, `-1`, `+0.5`, `¼`, `½`, `¾`).
  - **"Save & Next"** button for rapid consecutive data entry on touch screens.
  - Verification checkmark toggle (`[✓] Verified`) for tracking checked items on site.
  - Categorization with color tags and real-time category filtering.

- **📄 Single-Page PDF Print & Export**:
  - **Native Print Page**: Triggers browser/mobile print dialog formatted with CSS `@media print` rules specifically styled for clean, high-contrast, single-page A4/Letter printing.
  - **Standalone .PDF Download**: Generates standard PDF 1.4 binary documents offline using a pure client-side PDF generator (no external network or CDNs required).
  - **Text Summary Copy**: Instant clipboard copy formatted for quick sharing via WhatsApp, SMS, or Slack.
  - Configurable title, client reference, signature block, and date.

- **✏️ Touch Diagram & Sketch Pad**:
  - Dedicated mobile canvas popup to sketch dimensions, draw shapes, and place arrows (`<--->`).
  - Saved diagrams automatically embed directly into the printed PDF sheet!

- **⚡ Starter Templates**:
  - *Room & Interior Architecture* (Wall Length, Wall Width, Ceiling Height, Window/Door openings)
  - *Tailoring & Apparel* (Chest, Waist, Hips, Shoulder, Sleeve, Inseam, Neck)
  - *Carpentry & Woodworking* (Cut lengths, Board thickness, Leg height, Kerf)
  - *Box & Shipping* (Outer dimensions, Clearance, Volume, Weight)

- **🧮 Converter & Calculator**:
  - Live unit conversion between mm, cm, m, inches, feet, and fractional representations.
  - Instant Area ($L \times W$), Perimeter ($2(L+W)$), and Volume ($L \times W \times H$) calculator.

- **📁 Multiple Project Sheets**:
  - Create, switch, duplicate, and delete measurement projects.
  - Export and import full JSON backups.

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

## 🖨️ Printing or Saving PDF on Mobile

1. Tap **"Print PDF"** (top header button or bottom action bar).
2. Review the live single-page preview in the popup.
3. Tap **"Print Page (PDF)"**:
   - **On iOS (Safari)**: The system print preview opens. Pinch out on the preview to view/share full PDF, or tap "Print".
   - **On Android (Chrome)**: The system print dialog opens. Select "Save as PDF" from the printer dropdown.
4. Alternatively, tap **"Download .PDF"** to directly save the generated `.pdf` file to your device.
