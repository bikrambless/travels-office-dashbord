// ===== Guides Module =====
const Guides = {
  searchQuery: '',
  filterStatus: 'All',
  editingId: null,

  render() {
    const guides = this.getFiltered();
    const tbody = document.getElementById('guides-tbody');
    const countEl = document.getElementById('guides-count');

    if (countEl) countEl.textContent = guides.length;
    if (!tbody) return;

    if (guides.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i data-lucide="compass"></i><h4>No guides found</h4><p>Add your first tour guide</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    const statusBadgeClass = (s) => {
      const map = { 'Available': 'available', 'On Trip': 'on-trip', 'Leave': 'leave' };
      return map[s] || 'available';
    };

    tbody.innerHTML = guides.map(g => `
      <tr>
        <td>${this.esc(g.name)}</td>
        <td>${this.esc(g.phone)}</td>
        <td>${this.esc(g.languages)}</td>
        <td>${this.esc(g.specialization)}</td>
        <td>₹${(g.ratePerDay || 0).toLocaleString('en-IN')}/day</td>
        <td><span class="badge-status badge-${statusBadgeClass(g.status)}">${g.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="Guides.edit('${g.id}')" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
            <button class="btn-icon danger" onclick="App.confirmDelete('guides','${g.id}','${this.esc(g.name)}')" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  getFiltered() {
    let guides = Storage.getAll('guides');
    if (this.filterStatus !== 'All') {
      guides = guides.filter(g => g.status === this.filterStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      guides = guides.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.specialization.toLowerCase().includes(q) ||
        g.languages.toLowerCase().includes(q)
      );
    }
    return guides;
  },

  openModal(editId = null) {
    this.editingId = editId;
    const modal = document.getElementById('guide-modal');
    const title = document.getElementById('guide-modal-title');
    const form = document.getElementById('guide-form');
    form.reset();

    if (editId) {
      title.textContent = 'Edit Guide';
      const guide = Storage.getById('guides', editId);
      if (guide) {
        form.guideName.value = guide.name;
        form.guidePhone.value = guide.phone;
        form.guideLanguages.value = guide.languages || '';
        form.guideSpecialization.value = guide.specialization || '';
        form.guideRate.value = guide.ratePerDay || '';
        form.guideStatus.value = guide.status;
      }
    } else {
      title.textContent = 'Add New Guide';
    }
    App.openModal(modal);
  },

  save() {
    const form = document.getElementById('guide-form');
    const data = {
      name: form.guideName.value.trim(),
      phone: form.guidePhone.value.trim(),
      languages: form.guideLanguages.value.trim(),
      specialization: form.guideSpecialization.value.trim(),
      ratePerDay: parseFloat(form.guideRate.value) || 0,
      status: form.guideStatus.value,
    };

    if (!data.name || !data.phone) {
      App.toast('Please fill in guide name and phone', 'error');
      return;
    }

    if (this.editingId) {
      Storage.update('guides', this.editingId, data);
      App.toast('Guide updated successfully', 'success');
    } else {
      Storage.add('guides', data);
      App.toast('Guide added successfully', 'success');
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
