// ===== App Controller =====
const App = {
  currentPage: 'dashboard',
  deleteTarget: null,

  init() {
    // Initialize demo data on first visit
    Storage.initDemo();

    // Setup navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(item.dataset.page);
      });
    });

    // Setup header date
    const dateEl = document.getElementById('header-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        const q = e.target.value;
        if (this.currentPage === 'leads') { Leads.searchQuery = q; Leads.render(); }
        else if (this.currentPage === 'hotels') { Hotels.searchQuery = q; Hotels.render(); }
        else if (this.currentPage === 'guides') { Guides.searchQuery = q; Guides.render(); }
        else if (this.currentPage === 'payments') { Payments.searchQuery = q; Payments.render(); }
        else if (this.currentPage === 'b2b') { B2B.searchQuery = q; B2B.render(); }
      });
    }

    // Lead filter
    const leadFilter = document.getElementById('lead-status-filter');
    if (leadFilter) {
      leadFilter.addEventListener('change', (e) => {
        Leads.currentFilter = e.target.value;
        Leads.render();
      });
    }

    // Hotel city filter
    const hotelCityFilter = document.getElementById('hotel-city-filter');
    if (hotelCityFilter) {
      hotelCityFilter.addEventListener('change', (e) => {
        Hotels.filterCity = e.target.value;
        Hotels.render();
      });
    }

    // Guide status filter
    const guideFilter = document.getElementById('guide-status-filter');
    if (guideFilter) {
      guideFilter.addEventListener('change', (e) => {
        Guides.filterStatus = e.target.value;
        Guides.render();
      });
    }

    // Payment status filter
    const paymentFilter = document.getElementById('payment-status-filter');
    if (paymentFilter) {
      paymentFilter.addEventListener('change', (e) => {
        Payments.filterStatus = e.target.value;
        Payments.render();
      });
    }

    // B2B bill status filter
    const b2bBillFilter = document.getElementById('b2b-bill-filter');
    if (b2bBillFilter) {
      b2bBillFilter.addEventListener('change', (e) => {
        B2B.filterBillStatus = e.target.value;
        B2B.render();
      });
    }

    // Payment balance auto-calc
    const pkgCost = document.getElementById('paymentPackageCost');
    const advPaid = document.getElementById('paymentAdvance');
    if (pkgCost) pkgCost.addEventListener('input', () => Payments.updateBalance());
    if (advPaid) advPaid.addEventListener('input', () => Payments.updateBalance());

    // B2B bill balance auto-calc
    const b2bTotal = document.getElementById('b2bBillTotal');
    const b2bPaid = document.getElementById('b2bBillPaid');
    if (b2bTotal) b2bTotal.addEventListener('input', () => B2B.updateBillPending());
    if (b2bPaid) b2bPaid.addEventListener('input', () => B2B.updateBillPending());

    // Form submissions
    document.getElementById('lead-form')?.addEventListener('submit', (e) => { e.preventDefault(); Leads.save(); });
    document.getElementById('hotel-form')?.addEventListener('submit', (e) => { e.preventDefault(); Hotels.save(); });
    document.getElementById('guide-form')?.addEventListener('submit', (e) => { e.preventDefault(); Guides.save(); });
    document.getElementById('payment-form')?.addEventListener('submit', (e) => { e.preventDefault(); Payments.save(); });
    document.getElementById('b2b-partner-form')?.addEventListener('submit', (e) => { e.preventDefault(); B2B.savePartner(); });
    document.getElementById('b2b-bill-form')?.addEventListener('submit', (e) => { e.preventDefault(); B2B.saveBill(); });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });

    // Delete confirm
    document.getElementById('confirm-yes')?.addEventListener('click', () => {
      if (this.deleteTarget) {
        Storage.remove(this.deleteTarget.key, this.deleteTarget.id);
        this.toast(`${this.deleteTarget.name} deleted`, 'success');
        this.closeConfirm();
        this.renderCurrentPage();
        Dashboard.render();
        Leads.updateNavBadge();
      }
    });
    document.getElementById('confirm-no')?.addEventListener('click', () => this.closeConfirm());

    // Export / Import
    document.getElementById('btn-export')?.addEventListener('click', () => {
      Storage.exportData();
      this.toast('Data exported successfully', 'success');
    });
    document.getElementById('btn-import')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
    document.getElementById('import-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await Storage.importData(file);
          this.toast('Data imported successfully', 'success');
          this.renderCurrentPage();
          Dashboard.render();
          Leads.updateNavBadge();
        } catch {
          this.toast('Failed to import data', 'error');
        }
        e.target.value = '';
      }
    });

    // Mobile sidebar toggle
    document.getElementById('mobile-toggle')?.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });

    // Initialize everything
    Hotels.populateCityFilter();
    Leads.updateNavBadge();
    this.navigate('dashboard');
    lucide.createIcons();
  },

  navigate(page) {
    this.currentPage = page;

    // Update nav active
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Switch page sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update header title
    const titles = {
      dashboard: 'Dashboard',
      leads: 'Lead Management',
      b2b: 'B2B Travel Partners',
      hotels: 'Hotel Partners',
      guides: 'Tour Guides',
      payments: 'Payment Tracker'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[page] || 'Dashboard';

    // Clear global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) globalSearch.value = '';

    // Render page content
    this.renderCurrentPage();

    // Close mobile sidebar
    document.querySelector('.sidebar')?.classList.remove('open');
  },

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'dashboard': Dashboard.render(); break;
      case 'leads': Leads.render(); break;
      case 'b2b': B2B.render(); break;
      case 'hotels': Hotels.render(); break;
      case 'guides': Guides.render(); break;
      case 'payments': Payments.render(); break;
    }
  },

  openModal(modalEl) {
    modalEl?.classList.add('active');
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  },

  confirmDelete(key, id, name) {
    this.deleteTarget = { key, id, name };
    const overlay = document.getElementById('confirm-overlay');
    const nameEl = document.getElementById('confirm-item-name');
    if (nameEl) nameEl.textContent = name;
    overlay?.classList.add('active');
  },

  closeConfirm() {
    document.getElementById('confirm-overlay')?.classList.remove('active');
    this.deleteTarget = null;
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" style="width:18px;height:18px;flex-shrink:0"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
