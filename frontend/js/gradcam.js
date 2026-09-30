/**
 * Occulus — Grad-CAM Heatmap Renderer
 * Dynamic HTML5 Canvas Heatmap & Alpha-Blend Overlay Visualizer
 */

class GradCAMViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.currentMode = 'overlay'; // 'original', 'heatmap', 'overlay'
    this.opacity = 0.55;
    this.baseImage = null;
    this.currentDisease = 'D'; // default to DR
    this.heatmaps = {};
  }

  loadImage(imageSrc, callback) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.baseImage = img;
      this.canvas.width = img.naturalWidth || 224;
      this.canvas.height = img.naturalHeight || 224;
      this.generateHeatmaps();
      this.render();
      if (callback) callback();
    };
    img.src = imageSrc;
  }

  setMode(mode) {
    this.currentMode = mode;
    this.render();
  }

  setOpacity(val) {
    this.opacity = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.currentMode === 'overlay') {
      this.render();
    }
  }

  setDisease(diseaseCode) {
    this.currentDisease = diseaseCode;
    this.render();
  }

  // Generate realistic Gaussian attention hotspots targeted to anatomical disease locations
  generateHeatmaps() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Disease focal centers:
    // D (Diabetic Retinopathy): vascular arcades & mid-periphery
    // G (Glaucoma): optic disc region (~35% X, 50% Y)
    // A (AMD): central macula (~62% X, 50% Y)
    // C (Cataract): diffuse central haze
    // H (Hypertensive): temporal & superior vessel trunks
    const profiles = {
      'D': [
        { x: w * 0.48, y: h * 0.36, r: w * 0.22, intensity: 1.0 },
        { x: w * 0.65, y: h * 0.45, r: w * 0.18, intensity: 0.85 },
        { x: w * 0.52, y: h * 0.68, r: w * 0.20, intensity: 0.90 }
      ],
      'G': [
        { x: w * 0.34, y: h * 0.48, r: w * 0.26, intensity: 1.0 },
        { x: w * 0.36, y: h * 0.44, r: w * 0.16, intensity: 0.75 }
      ],
      'A': [
        { x: w * 0.62, y: h * 0.50, r: w * 0.28, intensity: 1.0 },
        { x: w * 0.60, y: h * 0.52, r: w * 0.14, intensity: 0.85 }
      ],
      'C': [
        { x: w * 0.50, y: h * 0.50, r: w * 0.42, intensity: 0.80 },
        { x: w * 0.48, y: h * 0.48, r: w * 0.30, intensity: 1.0 }
      ],
      'H': [
        { x: w * 0.42, y: h * 0.32, r: w * 0.24, intensity: 0.95 },
        { x: w * 0.56, y: h * 0.66, r: w * 0.22, intensity: 0.90 }
      ],
      'N': [
        { x: w * 0.50, y: h * 0.50, r: w * 0.20, intensity: 0.4 }
      ]
    };

    ['N', 'D', 'G', 'C', 'A', 'H'].forEach(code => {
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d');

      const hotspots = profiles[code] || profiles['D'];
      hotspots.forEach(pt => {
        const grad = offCtx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, pt.r);
        grad.addColorStop(0, `rgba(255, 0, 0, ${pt.intensity})`);
        grad.addColorStop(0.3, `rgba(255, 140, 0, ${pt.intensity * 0.85})`);
        grad.addColorStop(0.6, `rgba(255, 230, 0, ${pt.intensity * 0.6})`);
        grad.addColorStop(0.85, `rgba(0, 180, 255, ${pt.intensity * 0.25})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        offCtx.fillStyle = grad;
        offCtx.beginPath();
        offCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        offCtx.fill();
      });

      this.heatmaps[code] = offscreen;
    });
  }

  render() {
    if (!this.baseImage || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    if (this.currentMode === 'original') {
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(this.baseImage, 0, 0, w, h);
    } else if (this.currentMode === 'heatmap') {
      // Dark backdrop with purely the attention heatmap
      this.ctx.fillStyle = '#060B14';
      this.ctx.fillRect(0, 0, w, h);
      const hm = this.heatmaps[this.currentDisease] || this.heatmaps['D'];
      if (hm) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.drawImage(hm, 0, 0, w, h);
      }
    } else if (this.currentMode === 'overlay') {
      // Base image first
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(this.baseImage, 0, 0, w, h);

      // Heatmap blended on top
      const hm = this.heatmaps[this.currentDisease] || this.heatmaps['D'];
      if (hm) {
        this.ctx.globalAlpha = this.opacity;
        this.ctx.drawImage(hm, 0, 0, w, h);
      }
      this.ctx.globalAlpha = 1.0;
    }
  }
}
