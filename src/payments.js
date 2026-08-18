// ===== Payments Module =====
const Payments = {
  searchQuery: '',
  filterStatus: 'All',
  editingId: null,

  render() {
    const payments = this.getFiltered();
    const tbody = document.getElementById('payments-tbody');
    const countEl = document.getElementById('payments-count');

    if (countEl) countEl.textContent = payments.length;
    if (!tbody) return;

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i data-lucide="indian-rupee"></i><h4>No payments found</h4><p>Record your first payment</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    const statusBadgeClass = (s) => {
      const map = { 'Fully Paid': 'fully-paid', 'Partially Paid': 'partially-paid', 'Unpaid': 'unpaid' };
      return map[s] || 'unpaid';
    };

    tbody.innerHTML = payments.map(p => {
      const pct = p.packageCost > 0 ? Math.round((p.advancePaid / p.packageCost) * 100) : 0;
      const progressClass = pct >= 100 ? 'green' : pct >= 40 ? 'amber' : 'red';

      return `
        <tr>
          <td>${this.esc(p.leadName)}</td>
          <td>₹${(p.packageCost || 0).toLocaleString('en-IN')}</td>
          <td style="color:var(--accent-emerald-light);font-weight:600">₹${(p.advancePaid || 0).toLocaleString('en-IN')}</td>
          <td style="color:var(--accent-coral-light);font-weight:600">₹${(p.balance || 0).toLocaleString('en-IN')}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="progress-bar"><div class="progress-fill ${progressClass}" style="width:${pct}%"></div></div>
              <span style="font-size:0.75rem;color:var(--text-muted);min-width:32px">${pct}%</span>
            </div>
          </td>
          <td><span class="badge-status badge-${statusBadgeClass(p.status)}">${p.status}</span></td>
          <td>${this.esc(p.paymentMethod)}</td>
          <td>${p.paymentDate || '-'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;height:auto;color:var(--accent-primary-light)" onclick="Invoice.openCustomerInvoice('${p.id}')" title="Generate & Share Invoice PDF"><i data-lucide="file-text" style="width:13px;height:13px"></i> Invoice PDF</button>
              <button class="btn-icon" onclick="Payments.edit('${p.id}')" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
              <button class="btn-icon danger" onclick="App.confirmDelete('payments','${p.id}','${this.esc(p.leadName)}')" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    lucide.createIcons();
  },

  getFiltered() {
    let payments = Storage.getAll('payments');
    if (this.filterStatus !== 'All') {
      payments = payments.filter(p => p.status === this.filterStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      payments = payments.filter(p =>
        p.leadName.toLowerCase().includes(q)
      );
    }
    return payments;
  },

  populateLeadSelect() {
    const select = document.getElementById('paymentLead');
    if (!select) return;
    const leads = Storage.getAll('leads');
    select.innerHTML = '<option value="">-- Select Lead --</option>' +
      leads.map(l => `<option value="${l.id}" data-name="${l.name}">${l.name} — ${l.destination}</option>`).join('');
  },

  openModal(editId = null) {
    this.editingId = editId;
    const modal = document.getElementById('payment-modal');
    const title = document.getElementById('payment-modal-title');
    const form = document.getElementById('payment-form');
    form.reset();
    this.populateLeadSelect();

    if (editId) {
      title.textContent = 'Edit Payment';
      const payment = Storage.getById('payments', editId);
      if (payment) {
        form.paymentLead.value = payment.leadId || '';
        form.paymentPackageCost.value = payment.packageCost || '';
        form.paymentAdvance.value = payment.advancePaid || '';
        form.paymentMethod.value = payment.paymentMethod || 'Cash';
        form.paymentDate.value = payment.paymentDate || '';
        form.paymentNotes.value = payment.notes || '';
        this.updateBalance();
      }
    } else {
      title.textContent = 'Add New Payment';
    }
    App.openModal(modal);
  },

  updateBalance() {
    const form = document.getElementById('payment-form');
    const cost = parseFloat(form.paymentPackageCost.value) || 0;
    const advance = parseFloat(form.paymentAdvance.value) || 0;
    const balanceEl = document.getElementById('payment-balance-display');
    if (balanceEl) {
      const bal = Math.max(0, cost - advance);
      balanceEl.textContent = '₹' + bal.toLocaleString('en-IN');
    }
  },

  save() {
    const form = document.getElementById('payment-form');
    const leadSelect = form.paymentLead;
    const selectedOption = leadSelect.options[leadSelect.selectedIndex];
    const leadName = selectedOption ? selectedOption.getAttribute('data-name') || selectedOption.textContent.split('—')[0].trim() : '';

    const packageCost = parseFloat(form.paymentPackageCost.value) || 0;
    const advancePaid = parseFloat(form.paymentAdvance.value) || 0;
    const balance = Math.max(0, packageCost - advancePaid);

    let status = 'Unpaid';
    if (advancePaid >= packageCost && packageCost > 0) status = 'Fully Paid';
    else if (advancePaid > 0) status = 'Partially Paid';

    const data = {
      leadId: form.paymentLead.value,
      leadName: leadName,
      packageCost,
      advancePaid,
      balance,
      status,
      paymentMethod: form.paymentMethod.value,
      paymentDate: form.paymentDate.value,
      notes: form.paymentNotes.value.trim(),
    };

    if (!data.leadId) {
      App.toast('Please select a lead', 'error');
      return;
    }

    if (this.editingId) {
      Storage.update('payments', this.editingId, data);
      App.toast('Payment updated successfully', 'success');
    } else {
      Storage.add('payments', data);
      App.toast('Payment recorded successfully', 'success');
    }

    App.closeAllModals();
    this.render();
    Dashboard.render();
  },

  edit(id) { this.openModal(id); },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
