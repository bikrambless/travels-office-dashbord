// ===== B2B Travel Partners & Billing Module =====
const B2B = {
  currentTab: 'partners',
  searchQuery: '',
  filterBillStatus: 'All',
  editingPartnerId: null,
  editingBillId: null,

  render() {
    this.renderStats();
    this.populatePartnerSelects();

    if (this.currentTab === 'partners') {
      this.renderPartners();
    } else if (this.currentTab === 'bills') {
      this.renderBills();
    } else if (this.currentTab === 'leads') {
      this.renderLeads();
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.b2b-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.b2b-tab-content').forEach(c => {
      c.style.display = c.id === `b2b-tab-${tab}` ? 'block' : 'none';
    });
    this.render();
  },

  renderStats() {
    const partners = Storage.getAll('b2bPartners');
    const bills = Storage.getAll('b2bBills');
    const leads = Storage.getAll('leads');

    const totalPartners = partners.length;
    const b2bLeads = leads.filter(l => l.b2bPartnerId && l.b2bPartnerId !== '').length;
    const totalBilled = bills.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
    const totalPending = bills.reduce((s, b) => s + (parseFloat(b.pendingAmount) || 0), 0);

    const partnerCountEl = document.getElementById('b2b-partners-count');
    const leadsCountEl = document.getElementById('b2b-stat-leads');
    const billedEl = document.getElementById('b2b-stat-billed');
    const pendingEl = document.getElementById('b2b-stat-pending');

    if (partnerCountEl) partnerCountEl.textContent = totalPartners;
    if (leadsCountEl) leadsCountEl.textContent = b2bLeads;
    if (billedEl) billedEl.textContent = '₹' + totalBilled.toLocaleString('en-IN');
    if (pendingEl) pendingEl.textContent = '₹' + totalPending.toLocaleString('en-IN');
  },

  renderPartners() {
    const tbody = document.getElementById('b2b-partners-tbody');
    if (!tbody) return;

    let partners = Storage.getAll('b2bPartners');
    const leads = Storage.getAll('leads');
    const bills = Storage.getAll('b2bBills');

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      partners = partners.filter(p =>
        p.agencyName.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }

    if (partners.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i data-lucide="briefcase"></i><h4>No B2B Partners found</h4><p>Add your first B2B partner agency to manage their leads and bills</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = partners.map(p => {
      const partnerLeads = leads.filter(l => l.b2bPartnerId === p.id);
      const partnerBills = bills.filter(b => b.partnerId === p.id);

      const totalBilled = partnerBills.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
      const totalPaid = partnerBills.reduce((s, b) => s + (parseFloat(b.paidAmount) || 0), 0);
      const pendingAmount = partnerBills.reduce((s, b) => s + (parseFloat(b.pendingAmount) || 0), 0);

      const pendingBadgeClass = pendingAmount > 0 ? 'badge-lost' : 'badge-won';

      return `
        <tr>
          <td>
            <div style="font-weight:600;color:var(--text-primary)">${this.esc(p.agencyName)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${this.esc(p.city || 'N/A')}</div>
          </td>
          <td>
            <div>${this.esc(p.contactPerson)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${this.esc(p.phone)}</div>
          </td>
          <td><span class="badge" style="background:rgba(99,102,241,0.15);color:var(--accent-primary-light);font-size:0.8rem;padding:4px 8px">${partnerLeads.length} Leads</span></td>
          <td>${p.commission ? p.commission + '%' : '-'}</td>
          <td>₹${totalBilled.toLocaleString('en-IN')}</td>
          <td style="color:var(--accent-emerald-light);font-weight:600">₹${totalPaid.toLocaleString('en-IN')}</td>
          <td><span class="badge-status ${pendingBadgeClass}">₹${pendingAmount.toLocaleString('en-IN')}</span></td>
          <td>
            <div class="table-actions">
              <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;height:auto" onclick="B2B.openBillModal(null, '${p.id}')" title="Create Bill for this partner"><i data-lucide="receipt" style="width:13px;height:13px"></i> + Bill</button>
              <button class="btn-icon" onclick="B2B.openPartnerModal('${p.id}')" title="Edit Partner"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
              <button class="btn-icon danger" onclick="App.confirmDelete('b2bPartners','${p.id}','${this.esc(p.agencyName)}')" title="Delete Partner"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    lucide.createIcons();
  },

  renderBills() {
    const tbody = document.getElementById('b2b-bills-tbody');
    if (!tbody) return;

    let bills = Storage.getAll('b2bBills');

    if (this.filterBillStatus !== 'All') {
      bills = bills.filter(b => b.status === this.filterBillStatus);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      bills = bills.filter(b =>
        b.invoiceNo.toLowerCase().includes(q) ||
        b.partnerName.toLowerCase().includes(q)
      );
    }

    if (bills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i data-lucide="receipt"></i><h4>No B2B Bills found</h4><p>Create a bill or invoice for a B2B partner</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    const statusBadgeClass = (s) => {
      const map = { 'Fully Paid': 'fully-paid', 'Partially Paid': 'partially-paid', 'Unpaid': 'unpaid' };
      return map[s] || 'unpaid';
    };

    tbody.innerHTML = bills.map(b => `
      <tr>
        <td style="font-weight:600;color:var(--accent-primary-light)">${this.esc(b.invoiceNo)}</td>
        <td>${this.esc(b.partnerName)}</td>
        <td>${b.billDate || '-'}</td>
        <td>${b.dueDate || '-'}</td>
        <td>₹${(parseFloat(b.totalAmount) || 0).toLocaleString('en-IN')}</td>
        <td style="color:var(--accent-emerald-light);font-weight:600">₹${(parseFloat(b.paidAmount) || 0).toLocaleString('en-IN')}</td>
        <td style="color:var(--accent-coral-light);font-weight:700">₹${(parseFloat(b.pendingAmount) || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge-status badge-${statusBadgeClass(b.status)}">${b.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;height:auto;color:var(--accent-primary-light)" onclick="Invoice.openB2bInvoice('${b.id}')" title="Generate & Share Invoice PDF"><i data-lucide="file-text" style="width:13px;height:13px"></i> Invoice PDF</button>
            <button class="btn-icon" onclick="B2B.openBillModal('${b.id}')" title="Edit Bill"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
            <button class="btn-icon danger" onclick="App.confirmDelete('b2bBills','${b.id}','Bill ${this.esc(b.invoiceNo)}')" title="Delete Bill"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  renderLeads() {
    const tbody = document.getElementById('b2b-leads-tbody');
    if (!tbody) return;

    let leads = Storage.getAll('leads').filter(l => l.b2bPartnerId && l.b2bPartnerId !== '');

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      leads = leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.b2bPartnerName && l.b2bPartnerName.toLowerCase().includes(q))
      );
    }

    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i data-lucide="users"></i><h4>No B2B leads found</h4><p>Try searching for a different term or tag a lead</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = leads.map(l => `
      <tr>
        <td>${this.esc(l.name)}</td>
        <td>${this.esc(l.phone)}</td>
        <td><span class="badge" style="background:rgba(139,92,246,0.15);color:var(--accent-violet-light)">${this.esc(l.b2bPartnerName || 'B2B Partner')}</span></td>
        <td>${this.esc(l.destination)}</td>
        <td>${l.travelDate || '-'}</td>
        <td>₹${(l.budget || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge-status badge-${l.status.toLowerCase()}">${l.status}</span></td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  populatePartnerSelects() {
    const partnerSelect = document.getElementById('b2b-bill-partner');
    const leadB2bSelect = document.getElementById('leadB2bPartner');
    const partners = Storage.getAll('b2bPartners');

    if (partnerSelect) {
      const currentVal = partnerSelect.value;
      partnerSelect.innerHTML = '<option value="">-- Select B2B Partner --</option>' +
        partners.map(p => `<option value="${p.id}" data-name="${this.esc(p.agencyName)}">${this.esc(p.agencyName)} (${this.esc(p.city || '')})</option>`).join('');
      if (currentVal) partnerSelect.value = currentVal;
    }

    if (leadB2bSelect) {
      const currentVal = leadB2bSelect.value;
      leadB2bSelect.innerHTML = '<option value="">Direct Customer (No B2B Partner)</option>' +
        partners.map(p => `<option value="${p.id}" data-name="${this.esc(p.agencyName)}">${this.esc(p.agencyName)} (${this.esc(p.contactPerson)})</option>`).join('');
      if (currentVal) leadB2bSelect.value = currentVal;
    }
  },

  openPartnerModal(editId = null) {
    this.editingPartnerId = editId;
    const modal = document.getElementById('b2b-partner-modal');
    const title = document.getElementById('b2b-partner-modal-title');
    const form = document.getElementById('b2b-partner-form');
    form.reset();

    if (editId) {
      title.textContent = 'Edit B2B Partner';
      const partner = Storage.getById('b2bPartners', editId);
      if (partner) {
        form.b2bAgencyName.value = partner.agencyName || '';
        form.b2bContactPerson.value = partner.contactPerson || '';
        form.b2bPhone.value = partner.phone || '';
        form.b2bEmail.value = partner.email || '';
        form.b2bCity.value = partner.city || '';
        form.b2bCommission.value = partner.commission || '';
        form.b2bNotes.value = partner.notes || '';
      }
    } else {
      title.textContent = 'Add New B2B Partner';
    }
    App.openModal(modal);
  },

  savePartner() {
    const form = document.getElementById('b2b-partner-form');
    const data = {
      agencyName: form.b2bAgencyName.value.trim(),
      contactPerson: form.b2bContactPerson.value.trim(),
      phone: form.b2bPhone.value.trim(),
      email: form.b2bEmail.value.trim(),
      city: form.b2bCity.value.trim(),
      commission: parseFloat(form.b2bCommission.value) || 0,
      notes: form.b2bNotes.value.trim(),
    };

    if (!data.agencyName || !data.contactPerson || !data.phone) {
      App.toast('Please fill agency name, contact person, and phone', 'error');
      return;
    }

    if (this.editingPartnerId) {
      Storage.update('b2bPartners', this.editingPartnerId, data);
      App.toast('B2B Partner updated successfully', 'success');
    } else {
      Storage.add('b2bPartners', data);
      App.toast('B2B Partner added successfully', 'success');
    }

    App.closeAllModals();
    this.render();
  },

  openBillModal(editId = null, defaultPartnerId = null) {
    this.editingBillId = editId;
    const modal = document.getElementById('b2b-bill-modal');
    const title = document.getElementById('b2b-bill-modal-title');
    const form = document.getElementById('b2b-bill-form');
    form.reset();
    this.populatePartnerSelects();

    if (defaultPartnerId) {
      form.b2bBillPartner.value = defaultPartnerId;
    }

    if (editId) {
      title.textContent = 'Edit B2B Bill';
      const bill = Storage.getById('b2bBills', editId);
      if (bill) {
        form.b2bBillPartner.value = bill.partnerId || '';
        form.b2bBillInvoiceNo.value = bill.invoiceNo || '';
        form.b2bBillDate.value = bill.billDate || '';
        form.b2bBillDueDate.value = bill.dueDate || '';
        form.b2bBillTotal.value = bill.totalAmount || '';
        form.b2bBillPaid.value = bill.paidAmount || '';
        form.b2bBillNotes.value = bill.notes || '';
        this.updateBillPending();
      }
    } else {
      title.textContent = 'Create B2B Bill / Invoice';
      // Auto-generate invoice number
      form.b2bBillInvoiceNo.value = 'INV-B2B-' + Math.floor(100 + Math.random() * 900);
      form.b2bBillDate.value = new Date().toISOString().slice(0, 10);
    }
    App.openModal(modal);
  },

  updateBillPending() {
    const form = document.getElementById('b2b-bill-form');
    const total = parseFloat(form.b2bBillTotal.value) || 0;
    const paid = parseFloat(form.b2bBillPaid.value) || 0;
    const pending = Math.max(0, total - paid);
    const displayEl = document.getElementById('b2b-bill-pending-display');
    if (displayEl) {
      displayEl.textContent = '₹' + pending.toLocaleString('en-IN');
    }
  },

  saveBill() {
    const form = document.getElementById('b2b-bill-form');
    const partnerSelect = form.b2bBillPartner;
    const selectedOpt = partnerSelect.options[partnerSelect.selectedIndex];
    const partnerName = selectedOpt ? selectedOpt.getAttribute('data-name') || selectedOpt.textContent.split('(')[0].trim() : '';

    const totalAmount = parseFloat(form.b2bBillTotal.value) || 0;
    const paidAmount = parseFloat(form.b2bBillPaid.value) || 0;
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    let status = 'Unpaid';
    if (paidAmount >= totalAmount && totalAmount > 0) status = 'Fully Paid';
    else if (paidAmount > 0) status = 'Partially Paid';

    const data = {
      partnerId: form.b2bBillPartner.value,
      partnerName,
      invoiceNo: form.b2bBillInvoiceNo.value.trim(),
      billDate: form.b2bBillDate.value,
      dueDate: form.b2bBillDueDate.value,
      totalAmount,
      paidAmount,
      pendingAmount,
      status,
      notes: form.b2bBillNotes ? form.b2bBillNotes.value.trim() : '',
    };

    if (!data.partnerId || !data.invoiceNo) {
      App.toast('Please select a B2B partner and enter invoice number', 'error');
      return;
    }

    if (this.editingBillId) {
      Storage.update('b2bBills', this.editingBillId, data);
      App.toast('B2B Bill updated successfully', 'success');
    } else {
      Storage.add('b2bBills', data);
      App.toast('B2B Bill created successfully', 'success');
    }

    App.closeAllModals();
    this.render();
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
