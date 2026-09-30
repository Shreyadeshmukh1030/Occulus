/**
 * Occulus — Clinical Screening Workflow Manager
 * Handles Upload -> Processing Pipeline -> Result Visualization -> Report Generation
 */

const ScreeningWorkflow = {
  currentData: null,
  activeGradcam: null,

  init() {
    this.bindDropzone();
    this.bindPresets();
  },

  bindDropzone() {
    const dropzone = document.getElementById('fundus-dropzone');
    const fileInput = document.getElementById('fundus-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });
  },

  bindPresets() {
    const container = document.getElementById('sample-presets-container');
    if (!container) return;

    container.innerHTML = RETINA_DATA.samplePresets.map(preset => `
      <div class="sample-preset-btn" data-preset-id="${preset.id}">
        <img src="${preset.imagePath}" class="sample-preset-thumb" alt="${preset.title}">
        <div style="text-align: left; overflow: hidden;">
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-title); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${preset.title}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${preset.patientName} (${preset.eye})</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.sample-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-preset-id');
        const preset = RETINA_DATA.samplePresets.find(p => p.id === pId);
        if (preset) {
          this.loadPreset(preset);
        }
      });
    });
  },

  loadPreset(preset) {
    // Fill patient inputs
    document.getElementById('input-patient-id').value = preset.patientId;
    document.getElementById('input-patient-name').value = preset.patientName;
    document.getElementById('input-patient-age').value = preset.age;
    document.getElementById('input-patient-eye').value = preset.eye;

    this.currentData = {
      imagePath: preset.imagePath,
      fileName: `${preset.id}.png`,
      patientId: preset.patientId,
      patientName: preset.patientName,
      age: preset.age,
      eye: preset.eye,
      probabilities: preset.expectedProbabilities,
      quality: preset.quality,
      notes: preset.notes
    };

    this.showPreview(preset.imagePath, preset.title, "224 x 224 PNG", "61 KB");
  },

  handleFileUpload(file) {
    if (!file.type.match('image.*')) {
      alert("Please upload a valid fundus image (JPG or PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target.result;
      const eyeSide = document.getElementById('input-patient-eye').value || "Left";
      const patId = document.getElementById('input-patient-id').value || "PT-00130";
      const patName = document.getElementById('input-patient-name').value || "New Patient";
      const patAge = document.getElementById('input-patient-age').value || "55";

      // Inference simulation based on multi-label classifier
      this.currentData = {
        imagePath: imageSrc,
        fileName: file.name,
        patientId: patId,
        patientName: patName,
        age: patAge,
        eye: eyeSide,
        probabilities: { N: 0.03, D: 0.91, G: 0.22, C: 0.08, A: 0.05, H: 0.19 },
        quality: { status: "Acceptable", blurScore: 184.5, brightness: 112.3, contrast: 59.8 },
        notes: "Automated analysis completed on client-uploaded fundus image."
      };

      const sizeStr = `${Math.round(file.size / 1024)} KB`;
      this.showPreview(imageSrc, file.name, "Custom Upload", sizeStr);
    };
    reader.readAsDataURL(file);
  },

  showPreview(imageSrc, name, dim, size) {
    document.getElementById('upload-initial-state').style.display = 'none';
    const previewBox = document.getElementById('upload-preview-state');
    previewBox.style.display = 'flex';
    document.getElementById('preview-image').src = imageSrc;
    document.getElementById('preview-filename').textContent = name;
    document.getElementById('preview-meta').textContent = `${dim} • ${size}`;
    document.getElementById('btn-start-analysis').disabled = false;
  },

  startAnalysis() {
    if (!this.currentData) {
      alert("Please select a sample preset or upload a fundus image first.");
      return;
    }

    // Switch to View 5: Processing Screen
    AppRouter.navigate('screening-processing');
    document.getElementById('processing-preview-img').src = this.currentData.imagePath;

    // Simulate real clinical processing pipeline stages
    const stages = [
      { id: 'stage-1', delay: 400 },
      { id: 'stage-2', delay: 900 },
      { id: 'stage-3', delay: 1400 },
      { id: 'stage-4', delay: 2000 },
      { id: 'stage-5', delay: 2600 }
    ];

    stages.forEach(s => {
      setTimeout(() => {
        const el = document.getElementById(s.id);
        if (el) {
          el.classList.remove('active');
          el.classList.add('completed');
          el.querySelector('.stage-icon').innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
        }
      }, s.delay);
    });

    setTimeout(() => {
      this.renderScreeningResult();
      AppRouter.navigate('screening-result');
    }, 3000);
  },

  renderScreeningResult() {
    const data = this.currentData;
    if (!data) return;

    // Header info
    document.getElementById('res-scr-id').textContent = `SCR-${Math.floor(10000 + Math.random() * 90000)}`;
    document.getElementById('res-meta').textContent = `${data.patientName} (${data.patientId}) • ${data.age} yrs • ${data.eye} Eye • ${new Date().toLocaleDateString('en-GB')}`;

    // Quality Badge
    const qBadge = document.getElementById('res-quality-badge');
    if (data.quality.status === 'Acceptable') {
      qBadge.className = 'badge badge-acceptable';
      qBadge.innerHTML = `● Quality Passed (Blur: ${data.quality.blurScore}, Brightness: ${data.quality.brightness})`;
    } else {
      qBadge.className = 'badge badge-danger';
      qBadge.innerHTML = `▲ Quality Alert (${data.quality.status})`;
    }

    // Populate 6-Class Probability Bars [N, D, G, C, A, H]
    const probContainer = document.getElementById('res-prob-bars');
    probContainer.innerHTML = '';

    const conditionMap = [
      { code: 'D', name: 'Diabetic Retinopathy / Diabetes', threshold: 0.45 },
      { code: 'G', name: 'Glaucoma', threshold: 0.38 },
      { code: 'C', name: 'Cataract', threshold: 0.50 },
      { code: 'A', name: 'Age-Related Macular Degeneration', threshold: 0.42 },
      { code: 'H', name: 'Hypertensive Retinopathy', threshold: 0.35 },
      { code: 'N', name: 'Normal (No Pathologies Detected)', threshold: 0.50 }
    ];

    let detectedConditions = [];

    conditionMap.forEach(item => {
      const prob = data.probabilities[item.code] || 0.0;
      const pct = Math.round(prob * 100);
      const isDetected = prob >= item.threshold;
      if (isDetected && item.code !== 'N') {
        detectedConditions.push(item);
      }

      const itemEl = document.createElement('div');
      itemEl.className = `prob-item ${isDetected ? (item.code === 'N' ? 'normal-detected' : 'detected') : ''}`;
      itemEl.innerHTML = `
        <div class="prob-header">
          <div class="prob-label-title">
            <span>${item.name}</span>
            ${isDetected ? `<span class="badge ${item.code === 'N' ? 'badge-normal' : 'badge-warning'} text-xs">${item.code === 'N' ? 'Clear' : 'Detected'}</span>` : ''}
          </div>
          <div class="prob-percent" style="color: ${isDetected ? (item.code === 'N' ? '#059669' : '#DC2626') : 'var(--text-title)'};">
            ${pct}%
          </div>
        </div>
        <div class="prob-bar-container">
          <div class="prob-bar-fill ${isDetected ? (item.code === 'N' ? 'normal' : 'high') : ''}" style="width: ${pct}%;"></div>
        </div>
      `;
      probContainer.appendChild(itemEl);
    });

    // Update Status Pill
    const statusPill = document.getElementById('res-status-pill');
    if (detectedConditions.length > 0) {
      statusPill.className = 'badge badge-warning';
      statusPill.textContent = 'Requires Ophthalmologist Review';
      document.getElementById('res-interpretation-text').textContent = 
        `The multi-label ConvNeXt AI model identified patterns highly consistent with ${detectedConditions.map(c => c.name).join(' and ')}. Findings are highlighted in the explainable Grad-CAM heatmap below. Clinical confirmation by the attending ophthalmologist is advised.`;
    } else {
      statusPill.className = 'badge badge-normal';
      statusPill.textContent = 'Screening Negative / Clear';
      document.getElementById('res-interpretation-text').textContent = 
        "No significant retinal pathologies detected across the 5 monitored disease classes. Optic disc and retinal architecture appear within normal physiological variations.";
    }

    // Initialize Grad-CAM viewer on canvas
    this.activeGradcam = new GradCAMViewer('gradcam-canvas');
    this.activeGradcam.loadImage(data.imagePath);

    // Populate Explainable AI Disease Selector
    const xaiSelect = document.getElementById('xai-condition-select');
    xaiSelect.innerHTML = conditionMap.map(c => `
      <option value="${c.code}" ${detectedConditions.some(d => d.code === c.code) ? 'selected' : ''}>${c.name} (${Math.round((data.probabilities[c.code] || 0) * 100)}%)</option>
    `).join('');

    xaiSelect.onchange = (e) => {
      this.activeGradcam.setDisease(e.target.value);
    };

    // Opacity slider
    const slider = document.getElementById('gradcam-opacity-slider');
    slider.oninput = (e) => {
      this.activeGradcam.setOpacity(e.target.value);
    };

    // Mode buttons
    document.querySelectorAll('.segmented-btn[data-mode]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.segmented-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeGradcam.setMode(btn.getAttribute('data-mode'));
      };
    });
  },

  openDetailsReport(scrId) {
    const scr = RETINA_DATA.screenings.find(s => s.id === scrId) || RETINA_DATA.screenings[0];
    AppRouter.navigate('screening-details');

    document.getElementById('rep-id').textContent = scr.id;
    document.getElementById('rep-date').textContent = scr.date;
    document.getElementById('rep-patient').textContent = `${scr.patientName} (${scr.patientId})`;
    document.getElementById('rep-eye').textContent = `${scr.eye} Eye Fundus`;
    document.getElementById('rep-findings').textContent = scr.findings;
    document.getElementById('rep-status').textContent = scr.status;
    document.getElementById('rep-img').src = scr.imagePath;
  }
};
