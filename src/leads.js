// ===== Leads Module =====
const Leads = {
  currentFilter: 'All',
  searchQuery: '',
  editingId: null,

  render() {
    const leads = this.getFiltered();
    const tbody = document.getElementById('leads-tbody');
    const countEl = document.getElementById('leads-count');

    if (countEl) countEl.textContent = leads.length;

    if (!tbody) return;

    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i data-lucide="users"></i><h4>No leads found</h4><p>Add your first lead to get started</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = leads.map(l => `
      <tr>
        <td>
          <div style="font-weight:600">${this.esc(l.name)}</div>
          ${l.b2bPartnerName && l.b2bPartnerName !== 'Direct Customer' ? `<div style="font-size:0.72rem;color:var(--accent-violet-light)">Via: ${this.esc(l.b2bPartnerName)}</div>` : ''}
        </td>
        <td>${this.esc(l.phone)}</td>
        <td>${this.esc(l.destination)}</td>
        <td>${l.travelDate || '-'}</td>
        <td>${l.passengers || '-'}</td>
        <td>₹${(l.budget || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge-status badge-${l.status.toLowerCase()}">${l.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="Leads.edit('${l.id}')" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
            <button class="btn-icon danger" onclick="App.confirmDelete('leads','${l.id}','${this.esc(l.name)}')" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  getFiltered() {
    let leads = Storage.getAll('leads');
    if (this.currentFilter !== 'All') {
      leads = leads.filter(l => l.status === this.currentFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      leads = leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.b2bPartnerName && l.b2bPartnerName.toLowerCase().includes(q))
      );
    }
    return leads;
  },

  openModal(editId = null) {
    this.editingId = editId;
    const modal = document.getElementById('lead-modal');
    const title = document.getElementById('lead-modal-title');
    const form = document.getElementById('lead-form');
    form.reset();

    if (window.B2B) B2B.populatePartnerSelects();

    if (editId) {
      title.textContent = 'Edit Lead';
      const lead = Storage.getById('leads', editId);
      if (lead) {
        form.leadName.value = lead.name;
        form.leadPhone.value = lead.phone;
        form.leadEmail.value = lead.email || '';
        form.leadDestination.value = lead.destination;
        form.leadTravelDate.value = lead.travelDate || '';
        form.leadPassengers.value = lead.passengers || '';
        form.leadBudget.value = lead.budget || '';
        form.leadStatus.value = lead.status;
        if (form.leadB2bPartner) form.leadB2bPartner.value = lead.b2bPartnerId || '';
        form.leadNotes.value = lead.notes || '';
      }
    } else {
      title.textContent = 'Add New Lead';
    }
    App.openModal(modal);
  },

  save() {
    const form = document.getElementById('lead-form');
    const b2bSelect = form.leadB2bPartner;
    let b2bPartnerId = '';
    let b2bPartnerName = 'Direct Customer';

    if (b2bSelect && b2bSelect.value) {
      b2bPartnerId = b2bSelect.value;
      const selectedOpt = b2bSelect.options[b2bSelect.selectedIndex];
      b2bPartnerName = selectedOpt ? selectedOpt.getAttribute('data-name') || selectedOpt.textContent.split('(')[0].trim() : '';
    }

    const data = {
      name: form.leadName.value.trim(),
      phone: form.leadPhone.value.trim(),
      email: form.leadEmail.value.trim(),
      destination: form.leadDestination.value.trim(),
      travelDate: form.leadTravelDate.value,
      passengers: parseInt(form.leadPassengers.value) || 0,
      budget: parseFloat(form.leadBudget.value) || 0,
      status: form.leadStatus.value,
      b2bPartnerId,
      b2bPartnerName,
      notes: form.leadNotes.value.trim(),
    };

    if (!data.name || !data.phone) {
      App.toast('Please fill in name and phone', 'error');
      return;
    }

    if (this.editingId) {
      Storage.update('leads', this.editingId, data);
      App.toast('Lead updated successfully', 'success');
    } else {
      Storage.add('leads', data);
      App.toast('Lead added successfully', 'success');
    }

    App.closeAllModals();
    this.render();
    Dashboard.render();
    if (window.B2B) B2B.render();
    this.updateNavBadge();
  },

  edit(id) { this.openModal(id); },

  updateNavBadge() {
    const badge = document.getElementById('nav-leads-badge');
    if (badge) {
      const count = Storage.getAll('leads').filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
      badge.textContent = count;
    }
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
