/**
 * Occulus — Main Controller & Router
 * Role-Based Access Control (Doctor vs Admin) and View Switcher
 */

const AppRouter = {
  currentRole: 'doctor', // 'doctor' or 'admin'
  currentView: 'landing',

  init() {
    this.bindNavigation();
    this.bindRoleSwitcher();
    this.bindEyeExplorer();
    this.populateTables();
    ScreeningWorkflow.init();

    // Handle hash change or initial route
    window.addEventListener('hashchange', () => this.handleRoute());
    if (window.location.hash) {
      this.handleRoute();
    } else {
      this.navigate('landing');
    }
  },

  navigate(viewId) {
    window.location.hash = `#${viewId}`;
  },

  handleRoute() {
    const rawHash = window.location.hash.replace('#', '') || 'landing';
    this.showView(rawHash);
  },

  showView(viewId) {
    this.currentView = viewId;

    // Determine layout: Public (Landing / Login) vs Authenticated Shell
    const isPublic = (viewId === 'landing' || viewId === 'login');
    const shellEl = document.getElementById('authenticated-shell');
    const landingEl = document.getElementById('view-landing');
    const loginEl = document.getElementById('view-login');

    if (isPublic) {
      if (shellEl) shellEl.style.display = 'none';
      if (landingEl) landingEl.style.display = (viewId === 'landing') ? 'block' : 'none';
      if (loginEl) loginEl.style.display = (viewId === 'login') ? 'flex' : 'none';
      window.scrollTo(0, 0);
      return;
    }

    // Inside Authenticated Shell
    if (landingEl) landingEl.style.display = 'none';
    if (loginEl) loginEl.style.display = 'none';
    if (shellEl) shellEl.style.display = 'flex';

    // Hide all view pages inside shell
    document.querySelectorAll('.app-view-page').forEach(page => {
      page.style.display = 'none';
    });

    // Show target view
    const targetEl = document.getElementById(`view-${viewId}`);
    if (targetEl) {
      targetEl.style.display = 'block';
    } else {
      // Fallback
      document.getElementById('view-doctor-dashboard').style.display = 'block';
    }

    // Update active nav links
    document.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === `#${viewId}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Topbar Breadcrumb
    const pageTitleMap = {
      'doctor-dashboard': 'Ophthalmologist Dashboard',
      'new-screening': 'New Fundus Screening',
      'screening-processing': 'AI Analysis in Progress',
      'screening-result': 'Screening Result & Grad-CAM',
      'screening-history': 'Clinical Screening History',
      'screening-details': 'Diagnostic Screening Report',
      'patient-records': 'Patient Medical Records',
      'analytics': 'Clinical Analytics & AI Performance',
      'health-trends': 'Longitudinal Health Trends',
      'eye-explorer': 'Interactive Eye Explorer',
      'admin-dashboard': 'Hospital System Administration',
      'user-management': 'User Directory & Permissions',
      'profile-settings': 'Clinician Profile & Preferences'
    };
    const bc = document.getElementById('topbar-page-title');
    if (bc) bc.textContent = pageTitleMap[viewId] || 'Platform';

    // Render charts if entering analytics or dashboard
    if (viewId === 'doctor-dashboard') {
      RetinaCharts.renderActivityChart('dashboard-activity-chart');
      RetinaCharts.renderDistributionBars('dashboard-dist-bars');
    } else if (viewId === 'analytics') {
      RetinaCharts.renderActivityChart('analytics-activity-chart');
      RetinaCharts.renderDistributionBars('analytics-dist-bars');
    } else if (viewId === 'health-trends') {
      RetinaCharts.renderTrendChart('health-trend-chart');
    }

    window.scrollTo(0, 0);
  },

  bindNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = link.getAttribute('href').replace('#', '');
        if (target) {
          e.preventDefault();
          this.navigate(target);
        }
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
  },

  bindRoleSwitcher() {
    const switcher = document.getElementById('role-switcher-card');
    if (!switcher) return;

    switcher.addEventListener('click', () => {
      if (this.currentRole === 'doctor') {
        this.setRole('admin');
      } else {
        this.setRole('doctor');
      }
    });

    // Demo login switcher buttons
    const btnDoc = document.getElementById('demo-login-doctor');
    const btnAdm = document.getElementById('demo-login-admin');
    if (btnDoc) {
      btnDoc.addEventListener('click', () => {
        this.setRole('doctor');
        this.navigate('doctor-dashboard');
      });
    }
    if (btnAdm) {
      btnAdm.addEventListener('click', () => {
        this.setRole('admin');
        this.navigate('admin-dashboard');
      });
    }
  },

  setRole(role) {
    this.currentRole = role;
    const user = (role === 'admin') ? RETINA_DATA.adminUser : RETINA_DATA.currentUser;

    // Update avatar and labels
    document.querySelectorAll('.current-user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.current-user-role').forEach(el => el.textContent = (role === 'admin') ? 'Chief Administrator' : 'Attending Ophthalmologist');
    document.querySelectorAll('.current-user-avatar').forEach(el => el.textContent = user.avatar);

    // Toggle navigation visibility based on role
    document.querySelectorAll('.doctor-only').forEach(el => {
      el.style.display = (role === 'doctor') ? 'block' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = (role === 'admin') ? 'block' : 'none';
    });

    // If on admin view and switched to doctor, go to doctor dashboard
    if (role === 'doctor' && (this.currentView === 'admin-dashboard' || this.currentView === 'user-management')) {
      this.navigate('doctor-dashboard');
    } else if (role === 'admin' && (this.currentView === 'doctor-dashboard' || this.currentView === 'new-screening')) {
      this.navigate('admin-dashboard');
    }
  },

  bindEyeExplorer() {
    const hotspots = document.querySelectorAll('.hotspot');
    hotspots.forEach(hs => {
      hs.addEventListener('click', () => {
        const spotId = hs.getAttribute('data-spot');
        const info = RETINA_DATA.anatomyHotspots.find(a => a.id === spotId);
        if (info) {
          document.getElementById('explorer-spot-title').textContent = info.title;
          document.getElementById('explorer-spot-summary').textContent = info.summary;
          document.getElementById('explorer-spot-details').textContent = info.details;
          document.getElementById('explorer-spot-relevance').textContent = info.relevance;
          document.getElementById('explorer-info-card').style.display = 'block';
        }
      });
    });
  },

  populateTables() {
    // 1. Recent Screenings Table on Dashboard & History
    const historyTbody = document.getElementById('history-table-body');
    const dashTbody = document.getElementById('dash-recent-table-body');

    const renderRows = (limit = null) => {
      const list = limit ? RETINA_DATA.screenings.slice(0, limit) : RETINA_DATA.screenings;
      return list.map(s => `
        <tr>
          <td><strong style="color: var(--brand-royal);">${s.id}</strong></td>
          <td>
            <div style="font-weight: 600;">${s.patientName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.patientId}</div>
          </td>
          <td>${s.date}</td>
          <td><span class="badge badge-info">${s.eye} Eye</span></td>
          <td>${s.findings}</td>
          <td>
            <span class="badge ${s.statusCode === 'reviewed' ? 'badge-reviewed' : 'badge-warning'}">
              ${s.status}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="ScreeningWorkflow.openDetailsReport('${s.id}')">
              View Report
            </button>
          </td>
        </tr>
      `).join('');
    };

    if (dashTbody) dashTbody.innerHTML = renderRows(3);
    if (historyTbody) historyTbody.innerHTML = renderRows();

    // 2. Patients Table
    const patientsTbody = document.getElementById('patients-table-body');
    if (patientsTbody) {
      patientsTbody.innerHTML = RETINA_DATA.patients.map(p => `
        <tr>
          <td><strong style="color: var(--brand-royal);">${p.id}</strong></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.age} yrs / ${p.gender}</td>
          <td>${p.history}</td>
          <td>${p.lastScreening}</td>
          <td>${p.flaggedConditions.map(c => `<span class="badge badge-warning">${c}</span>`).join(' ')}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="AppRouter.openPatientModal('${p.id}')">
              Records
            </button>
          </td>
        </tr>
      `).join('');
    }
  },

  openPatientModal(patientId) {
    const p = RETINA_DATA.patients.find(pt => pt.id === patientId);
    if (!p) return;

    document.getElementById('modal-pat-name').textContent = p.name;
    document.getElementById('modal-pat-id').textContent = p.id;
    document.getElementById('modal-pat-age-gender').textContent = `${p.age} years • ${p.gender}`;
    document.getElementById('modal-pat-history').textContent = p.history;
    document.getElementById('modal-pat-phone').textContent = p.phone;

    const modal = document.getElementById('patient-detail-modal');
    if (modal) modal.classList.add('open');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppRouter.init();
});
