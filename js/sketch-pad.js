/**
 * SizeNotes - Touch & Mouse Sketch Pad Module
 * Optimized for mobile touch, dimension arrows, photo backdrop, text stamps,
 * and fast architectural/tailoring doodle.
 */
class SketchPad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.isDrawing = false;
    this.tool = 'pen'; // 'pen', 'line', 'arrow', 'rect', 'text', 'eraser'
    this.color = '#0284c7';
    this.lineWidth = 3;
    
    this.history = [];
    this.startX = 0;
    this.startY = 0;
    this.snapshot = null;

    this.initCanvasSize();
    this.bindEvents();

    // Re-adjust canvas seamlessly on tablet orientation change or window resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.canvas && this.canvas.offsetParent !== null) {
          const curData = this.toDataURL();
          this.initCanvasSize();
          if (curData) {
            this.loadFromDataURL(curData);
          }
        }
      }, 100);
    });
  }

  initCanvasSize() {
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : null;
    const dpr = window.devicePixelRatio || 1;
    const width = (rect && rect.width > 0) ? rect.width : (parent && parent.clientWidth > 0 ? parent.clientWidth : 320);
    
    // Responsive canvas height for mobile phone, tablet portrait, and tablet landscape
    let height = 240;
    if (window.innerWidth >= 1024) {
      height = window.innerHeight < 650 ? 260 : 400;
    } else if (window.innerWidth >= 768) {
      height = window.innerHeight < 650 ? 260 : 340;
    }

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = height + 'px';

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    this.ctx.scale(dpr, dpr);
    this.clearBackground();
    this.history = [];
    this.saveState();
  }

  clearBackground() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = this.canvas.width / dpr;
    const cssHeight = this.canvas.height / dpr;

    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, cssWidth, cssHeight);
    // Draw subtle grid dots for measurement guidance
    this.drawGrid(cssWidth, cssHeight);
    this.ctx.restore();
  }

  drawGrid(cssWidth, cssHeight) {
    const spacing = 20;
    const width = cssWidth || (this.canvas.width / (window.devicePixelRatio || 1));
    const height = cssHeight || (this.canvas.height / (window.devicePixelRatio || 1));
    this.ctx.fillStyle = '#e2e8f0';
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        this.ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }
  }

  saveState() {
    try {
      this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
      if (this.history.length > 25) {
        this.history.shift();
      }
    } catch (e) {
      console.warn('Canvas state save failed:', e);
    }
  }

  undo() {
    if (this.history.length > 1) {
      this.history.pop(); // remove current
      const prevState = this.history[this.history.length - 1];
      this.ctx.putImageData(prevState, 0, 0);
    }
  }

  clear() {
    this.clearBackground();
    this.history = [];
    this.saveState();
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  bindEvents() {
    const start = (e) => {
      e.preventDefault();
      const pos = this.getPointerPos(e);

      if (this.tool === 'text') {
        // Text Stamp tool: prompt user for dimension label / text
        const label = window.prompt('Enter measurement note or dimension label (e.g. "140 cm", "Clearance"):');
        if (label && label.trim()) {
          this.drawTextBadge(label.trim(), pos.x, pos.y);
        }
        return;
      }

      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      if (this.tool === 'pen' || this.tool === 'eraser') {
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      }
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getPointerPos(e);

      if (this.tool === 'pen') {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else if (this.tool === 'eraser') {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = this.lineWidth * 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else {
        // Shapes with preview
        this.ctx.putImageData(this.snapshot, 0, 0);
        this.ctx.strokeStyle = this.color;
        this.ctx.fillStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';

        if (this.tool === 'line') {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
        } else if (this.tool === 'arrow') {
          this.drawArrow(this.startX, this.startY, pos.x, pos.y);
        } else if (this.tool === 'rect') {
          this.ctx.strokeRect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
        }
      }
    };

    const end = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      this.saveState();
    };

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', start, { passive: false });
    this.canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: false });
  }

  drawArrow(fromX, fromY, toX, toY) {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    // Line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Arrowhead at destination
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();

    // Arrowhead at start (dimension style: <--->)
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(fromX + headlen * Math.cos(angle - Math.PI / 6), fromY + headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(fromX + headlen * Math.cos(angle + Math.PI / 6), fromY + headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawTextBadge(text, x, y) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = this.canvas.width / dpr;
    const cssHeight = this.canvas.height / dpr;

    this.ctx.save();
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    const paddingX = 8;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 22;

    const startX = Math.max(4, Math.min(x - boxWidth / 2, cssWidth - boxWidth - 4));
    const startY = Math.max(4, Math.min(y - boxHeight / 2, cssHeight - boxHeight - 4));

    // Badge pill shadow & background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetY = 1;
    this.roundRect(startX, startY, boxWidth, boxHeight, 4, true, false);

    // Border with active drawing color
    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = this.color;
    this.roundRect(startX, startY, boxWidth, boxHeight, 4, false, true);

    // Text in active drawing color
    this.ctx.fillStyle = this.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, startX + boxWidth / 2, startY + boxHeight / 2);
    this.ctx.restore();

    this.saveState();
  }

  roundRect(x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
    if (fill) this.ctx.fill();
    if (stroke) this.ctx.stroke();
  }

  loadPhoto(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = this.canvas.width / dpr;
        const cssHeight = this.canvas.height / dpr;

        // Contain photo preserving aspect ratio
        const hRatio = cssWidth / img.width;
        const vRatio = cssHeight / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;
        const shiftX = (cssWidth - drawWidth) / 2;
        const shiftY = (cssHeight - drawHeight) / 2;

        this.clearBackground();
        this.ctx.drawImage(img, 0, 0, img.width, img.height, shiftX, shiftY, drawWidth, drawHeight);
        this.saveState();
        if (callback) callback();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }

  loadFromDataURL(dataUrl, callback) {
    if (!dataUrl) {
      this.clear();
      if (callback) callback();
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.clearBackground();
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = this.canvas.width / dpr;
      const cssHeight = this.canvas.height / dpr;
      this.ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
      this.history = [];
      this.saveState();
      if (callback) callback();
    };
    img.src = dataUrl;
  }
}

window.SketchPad = SketchPad;
