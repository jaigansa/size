/**
 * SizeNotes - FreeCAD & Architectural Dimension Parser & Evaluator
 * Supports:
 * - FreeCAD / CAD notation: 1' 5" + 1/4", 1'-5 1/4", 1' 5", 3' 6" - 2"
 * - Arithmetic expressions: +, -, *, /, (, )
 * - Mixed & pure fractions: 5 1/4", 1/4", ¼, ½, ¾, ⅛, ⅜, ⅝, ⅞
 * - Multi-unit conversion: ft ('), in ("), yd, m, cm, mm
 * - Architectural formatting: 17.25" -> 1' 5 1/4"
 */

const CADParser = {
  toInches: {
    "'": 12, "ft": 12, "feet": 12, "foot": 12,
    '"': 1, "in": 1, "inch": 1, "inches": 1,
    "yd": 36, "yard": 36, "yards": 36,
    "m": 1 / 0.0254, "meter": 1 / 0.0254, "meters": 1 / 0.0254,
    "cm": 1 / 2.54, "centimeter": 1 / 2.54,
    "mm": 1 / 25.4, "millimeter": 1 / 25.4
  },

  fromInches: {
    "in": 1,
    '"': 1,
    "ft": 1 / 12,
    "'": 1 / 12,
    "yd": 1 / 36,
    "m": 0.0254,
    "cm": 2.54,
    "mm": 25.4
  },

  /**
   * Checks if a string contains CAD notation, units, fractions, or math operators
   */
  isCadExpression(str) {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim();
    return /['"+/*¼½¾⅛⅜⅝⅞-]/.test(s) || /\d+\/\d+/.test(s) || /\b(ft|in|cm|mm|m|yd)\b/i.test(s);
  },

  /**
   * Parses and evaluates any CAD dimension expression
   * e.g. "1' 5\" + 1/4\"" -> { value: 17.25, inches: 17.25, formatted: "1' 5 1/4\"", isExpression: true }
   */
  parse(exprStr, targetUnit = 'in') {
    if (!exprStr || typeof exprStr !== 'string') return null;
    let s = exprStr.trim();
    if (!s) return null;

    const hasExplicitUnit = /['"a-zA-Z]/.test(s);
    const hasImperialUnit = /['"]|\b(ft|feet|foot|in|inch|inches|yd|yard)\b/i.test(s);

    // Replace unicode fraction glyphs
    s = s.replace(/¼/g, ' 1/4')
         .replace(/½/g, ' 1/2')
         .replace(/¾/g, ' 3/4')
         .replace(/⅛/g, ' 1/8')
         .replace(/⅜/g, ' 3/8')
         .replace(/⅝/g, ' 5/8')
         .replace(/⅞/g, ' 7/8');

    // Architectural attached hyphen: 1'-5" or 1'-5 1/4" -> 1' 5"
    s = s.replace(/(\d+)'-(?=\d)/g, "$1' ");

    // Normalize word units
    s = s.replace(/\b(feet|foot|ft)\b/gi, "'")
         .replace(/\b(inches|inch|in)\b/gi, '"')
         .replace(/\b(meters|meter|m)\b/gi, 'm')
         .replace(/\b(centimeters|centimeter|cm)\b/gi, 'cm')
         .replace(/\b(millimeters|millimeter|mm)\b/gi, 'mm')
         .replace(/\b(yards|yard|yd)\b/gi, 'yd');

    // Replace dimension multiplication cross '×' or 'X' with '*'
    s = s.replace(/[×xX]/g, '*');

    // 1. Detect mixed fraction e.g. "5 1/4\"" -> "(5 + 1/4)\""
    s = s.replace(/(\d+)\s+(\d+\/\d+)(['"a-zA-Z]*)/g, "($1 + $2)$3");

    // 2. Detect feet followed immediately by inches e.g. "1' 5\"" or "1' (5 + 1/4)\"" or "1' 5"
    // Ensuring no operator (+, -, *, /) directly intervenes
    s = s.replace(/(\d+(?:\.\d+)?)\s*'\s*(?![-+*/])(\([\d\s+\/.]+\)|\d+(?:\.\d+)?)\s*("?)/g, "($1' + $2\")");

    // 3. Convert all quantities with explicit units to inches
    const qtyRegex = /(\([\d\s+\/.]+\)|\d+\/\d+|\d+(?:\.\d+)?)\s*('|"|yd|mm|cm|m)/g;
    s = s.replace(qtyRegex, (match, numPart, unitPart) => {
      const num = this.evalSubExpr(numPart);
      const mult = this.toInches[unitPart] || 1;
      return String(num * mult);
    });

    // 4. Handle remaining bare fractions (e.g. "+ 1/4")
    // - With imperial units present, bare quantities are inches (the common base).
    // - With only metric units present, bare quantities are in the target unit,
    //   so they must be converted to inches before the expression is evaluated.
    // - With no units at all, keep bare quantities as-is; step 5 interprets the
    //   final result in the target unit (e.g. "5 1/4" in cm = 5.25 cm).
    const isImperialContext = hasImperialUnit || targetUnit === 'in' || targetUnit === 'ft' || targetUnit === "'";
    const defaultMult = hasImperialUnit ? 1.0 : (hasExplicitUnit ? (this.toInches[targetUnit] || 1.0) : 1.0);

    s = s.replace(/\b(\d+\/\d+)\b/g, (match, fracPart) => {
      const num = this.evalSubExpr(fracPart);
      return String(num * defaultMult);
    });

    // 5. If whole expression had no units at all (e.g. "10 + 5" or "12.5"):
    if (!hasExplicitUnit) {
      if (!/^[-0-9+*\/().\s]+$/.test(s)) return null;
      let num = 0;
      try {
        num = Function(`'use strict'; return (${s})`)();
      } catch (e) {
        return null;
      }
      if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return null;

      // Convert a bare value in the target unit into inches.
      // fromInches: in=1, ft=1/12, yd=1/36, cm=2.54, mm=25.4, m=0.0254
      const totalInches = num / (this.fromInches[targetUnit] || 1);

      return {
        value: Math.round(num * 1000) / 1000,
        inches: totalInches,
        formatted: isImperialContext ? this.formatArchitectural(totalInches) : String(Math.round(num * 1000) / 1000),
        isExpression: /[-+*/]/.test(exprStr)
      };
    }

    // Expression had explicit units and was converted to inches:
    if (!/^[-0-9+*\/().\s]+$/.test(s)) {
      return null;
    }

    let totalInches = 0;
    try {
      totalInches = Function(`'use strict'; return (${s})`)();
    } catch (e) {
      return null;
    }

    if (typeof totalInches !== 'number' || isNaN(totalInches) || !isFinite(totalInches)) {
      return null;
    }

    const toTargetMult = this.fromInches[targetUnit] || 1;
    const valueInTarget = totalInches * toTargetMult;
    const formatted = this.formatArchitectural(totalInches);

    return {
      value: Math.round(valueInTarget * 1000) / 1000,
      inches: totalInches,
      formatted: formatted,
      isExpression: true
    };
  },

  evalSubExpr(ns) {
    ns = ns.replace(/[()]/g, '').trim();
    if (ns.includes('+')) {
      const parts = ns.split('+');
      return parts.reduce((acc, p) => acc + this.evalSubExpr(p), 0);
    }
    if (ns.includes('/')) {
      const [n, d] = ns.split('/');
      const den = parseFloat(d);
      return den !== 0 ? (parseFloat(n) / den) : 0;
    }
    return parseFloat(ns) || 0;
  },

  /**
   * Formats a total inch value into architectural standard: 1' 5 1/4", 10 3/8", 6', etc.
   */
  formatArchitectural(totalInches, precision = 16) {
    if (totalInches === null || totalInches === undefined || isNaN(totalInches)) return '';
    const sign = totalInches < 0 ? '-' : '';
    let absIn = Math.abs(totalInches);

    let feet = Math.floor(absIn / 12);
    let remIn = absIn - (feet * 12);

    let wholeIn = Math.floor(remIn);
    let fracIn = remIn - wholeIn;

    // Round fraction to nearest 1/16 (or custom precision)
    let sixteenths = Math.round(fracIn * precision);
    if (sixteenths === precision) {
      wholeIn += 1;
      sixteenths = 0;
    }
    if (wholeIn === 12) {
      feet += 1;
      wholeIn = 0;
    }

    let fracStr = '';
    if (sixteenths > 0) {
      if (sixteenths % 8 === 0) fracStr = `${sixteenths / 8}/2`;
      else if (sixteenths % 4 === 0) fracStr = `${sixteenths / 4}/4`;
      else if (sixteenths % 2 === 0) fracStr = `${sixteenths / 2}/8`;
      else fracStr = `${sixteenths}/16`;
    }

    const parts = [];
    if (feet > 0) parts.push(`${feet}'`);

    let inStr = '';
    if (wholeIn > 0 && fracStr) inStr = `${wholeIn} ${fracStr}"`;
    else if (wholeIn > 0) inStr = `${wholeIn}"`;
    else if (fracStr) inStr = `${fracStr}"`;
    else if (feet === 0) inStr = `0"`;

    if (inStr) parts.push(inStr);

    return sign + parts.join(' ');
  },

  /**
   * Returns a friendly live preview string for CAD expression inputs:
   * e.g. "= 1' 5 ¼\" (17.25 in)" or "= 43.82 cm (1' 5 ¼\")"
   */
  formatPreview(parseResult, targetUnit = 'in') {
    if (!parseResult) return '';
    const arch = parseResult.formatted || '';
    const val = parseResult.value;

    if (targetUnit === 'in' || targetUnit === 'ft' || targetUnit === "'") {
      if (arch && String(val) !== arch.replace(/["']/g, '')) {
        return `= ${arch} (${val} ${targetUnit})`;
      }
      return `= ${arch || val}`;
    }

    // Metric target units
    if (arch) {
      return `= ${val} ${targetUnit} (${arch})`;
    }
    return `= ${val} ${targetUnit}`;
  },

  /**
   * Generates a live evaluation hint string for input hints
   * e.g. "1' 5\" + 1/4\"" -> "= 1' 5 ¼\" (17.25 in)"
   */
  formatLiveHint(exprStr, targetUnit = 'in') {
    if (!exprStr || !this.isCadExpression(exprStr)) return null;
    const res = this.parse(exprStr, targetUnit);
    if (!res || isNaN(res.value)) return null;
    return this.formatPreview(res, targetUnit);
  },

  /**
   * Evaluates a single value string into a clean numeric value (for math/area/volume/sum)
   */
  evaluateToNumber(valStr, targetUnit = 'in') {
    if (!valStr) return NaN;
    valStr = String(valStr).trim();

    // If composite (e.g. 120 × 80), take first dimension
    if (valStr.includes('×') || valStr.includes('x') || valStr.includes('X')) {
      valStr = valStr.split(/[×xX]/)[0].trim();
    }

    const res = this.parse(valStr, targetUnit);
    return res ? res.value : NaN;
  },

  /**
   * Evaluates an input string (single or composite e.g. 1' 5" + 1/4" × 2')
   * into clean formatted dimension string for saving
   */
  resolveExpressionString(valStr, targetUnit = 'in') {
    if (!valStr || typeof valStr !== 'string') return valStr;
    const str = valStr.trim();
    if (!str) return str;

    // Check if composite with '×', 'x', or 'X'
    if (str.includes('×') || str.includes(' x ') || str.includes(' X ')) {
      const parts = str.split(/\s*[×xX]\s*/);
      return parts.map(p => {
        const parsed = this.parse(p, targetUnit);
        if (parsed && (p.includes('+') || p.includes('-') || p.includes('*') || p.includes('/'))) {
          return (targetUnit === 'in' || targetUnit === 'ft') ? (parsed.formatted || String(parsed.value)) : String(parsed.value);
        }
        return p;
      }).join(' × ');
    }

    // Single value
    const parsed = this.parse(str, targetUnit);
    if (parsed && (str.includes('+') || str.includes('-') || str.includes('*') || str.includes('/'))) {
      if (targetUnit === 'in' || targetUnit === 'ft' || targetUnit === "'") {
        return parsed.formatted || String(parsed.value);
      }
      return String(parsed.value);
    }

    return str;
  }
};

window.CADParser = CADParser;
