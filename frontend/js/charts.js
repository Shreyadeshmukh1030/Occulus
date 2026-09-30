/**
 * Occulus — Clinical Charting Engine
 * Native SVG & Canvas Interactive Medical Visualizations
 */

const RetinaCharts = {
  // Activity Timeline Line/Area Chart
  renderActivityChart(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = [14, 22, 19, 31, 28, 42, 38, 56, 49, 68, 62, 75];
    const labels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const max = 80;
    const w = 600;
    const h = 200;
    const padX = 40;
    const padY = 25;

    const points = data.map((val, i) => {
      const x = padX + (i / (data.length - 1)) * (w - padX * 2);
      const y = h - padY - (val / max) * (h - padY * 2);
      return { x, y, val, label: labels[i] };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;

    let dotsSvg = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0D47A1" stroke="#FFFFFF" stroke-width="2" class="chart-point" data-val="${p.val}" data-lbl="${p.label}">
        <title>${p.label}: ${p.val} Screenings</title>
      </circle>
    `).join('');

    let axisSvg = labels.map((l, i) => {
      const x = padX + (i / (data.length - 1)) * (w - padX * 2);
      return `<text x="${x}" y="${h - 6}" font-size="10" fill="#64748B" text-anchor="middle" font-weight="500">${l}</text>`;
    }).join('');

    el.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: 100%; overflow: visible;">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284C7" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0D47A1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Horizontal Gridlines -->
        <line x1="${padX}" y1="${padY}" x2="${w - padX}" y2="${padY}" stroke="#F1F5F9" stroke-width="1"/>
        <line x1="${padX}" y1="${h/2}" x2="${w - padX}" y2="${h/2}" stroke="#F1F5F9" stroke-width="1"/>
        <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="#E2E8F0" stroke-width="1"/>
        <!-- Area & Spline Path -->
        <path d="${areaD}" fill="url(#areaGrad)"/>
        <path d="${pathD}" fill="none" stroke="#0D47A1" stroke-width="3" stroke-linecap="round"/>
        ${dotsSvg}
        ${axisSvg}
      </svg>
    `;
  },

  // Longitudinal Patient Health Trend Chart
  renderTrendChart(containerId, series) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = series || [
      { date: "Jun 2026", score: 61 },
      { date: "Jul 2026", score: 68 },
      { date: "Aug 2026", score: 79 },
      { date: "Sep 2026", score: 93 }
    ];

    const w = 540;
    const h = 220;
    const padX = 50;
    const padY = 30;

    const points = data.map((d, i) => {
      const x = padX + (i / (data.length - 1)) * (w - padX * 2);
      const y = h - padY - (d.score / 100) * (h - padY * 2);
      return { x, y, score: d.score, date: d.date };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const dotsSvg = points.map(p => `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 12}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">${p.score}%</text>
        <text x="${p.x}" y="${h - 8}" font-size="11" fill="#64748B" text-anchor="middle" font-weight="500">${p.date}</text>
      </g>
    `).join('');

    el.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: 100%;">
        <!-- Clinical Threshold guide at 50% -->
        <line x1="${padX}" y1="${h/2}" x2="${w - padX}" y2="${h/2}" stroke="#F59E0B" stroke-dasharray="4 4" stroke-width="1.5"/>
        <text x="${w - padX}" y="${h/2 - 6}" font-size="9" font-weight="600" fill="#F59E0B" text-anchor="end">Detection Threshold (50%)</text>
        
        <path d="${pathD}" fill="none" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/>
        ${dotsSvg}
      </svg>
    `;
  },

  // Disease Prevalence Bars
  renderDistributionBars(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const items = [
      { name: "Diabetic Retinopathy", pct: 37.5, color: "#EF4444", count: 48 },
      { name: "Glaucoma Suspicion", pct: 21.8, color: "#F59E0B", count: 28 },
      { name: "Cataract", pct: 18.7, color: "#8B5CF6", count: 24 },
      { name: "AMD (Macular)", pct: 14.8, color: "#EC4899", count: 19 },
      { name: "Hypertension", pct: 10.9, color: "#06B6D4", count: 14 }
    ];

    el.innerHTML = items.map(item => `
      <div style="margin-bottom: 0.85rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem;">
          <span style="color: var(--text-title);">${item.name}</span>
          <span style="color: var(--text-muted);">${item.count} cases (${item.pct}%)</span>
        </div>
        <div style="width: 100%; height: 7px; background: var(--surface-subtle); border-radius: 999px; overflow: hidden;">
          <div style="width: ${item.pct * 2.2}%; height: 100%; background: ${item.color}; border-radius: 999px;"></div>
        </div>
      </div>
    `).join('');
  }
};
