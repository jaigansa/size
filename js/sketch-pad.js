/**
 * SizeNotes - Touch & Mouse Sketch Pad Module
 * Optimized for mobile touch, dimension arrows, and fast architectural/tailoring doodle
 */
class SketchPad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.isDrawing = false;
    this.tool = 'pen'; // 'pen', 'line', 'arrow', 'rect', 'eraser'
    this.color = '#0284c7';
    this.lineWidth = 3;
    
    this.history = [];
    this.startX = 0;
    this.startY = 0;
    this.snapshot = null;

    this.initCanvasSize();
    this.bindEvents();
  }

  initCanvasSize() {
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : null;
    const dpr = window.devicePixelRatio || 1;
    const width = (rect && rect.width > 0) ? rect.width : (parent && parent.clientWidth > 0 ? parent.clientWidth : 320);
    const height = 240;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = height + 'px';

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    this.ctx.scale(dpr, dpr);
    this.clearBackground();
    this.saveState();
  }

  clearBackground() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw subtle grid dots for measurement guidance
    this.drawGrid();
  }

  drawGrid() {
    const spacing = 20;
    const width = this.canvas.width;
    const height = this.canvas.height;
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
      if (this.history.length > 20) {
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
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, 260);
      this.history = [];
      this.saveState();
      if (callback) callback();
    };
    img.src = dataUrl;
  }
}

window.SketchPad = SketchPad;
