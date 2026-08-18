// ===== Hotels Module =====
const Hotels = {
  searchQuery: '',
  filterCity: 'All',
  editingId: null,

  render() {
    const hotels = this.getFiltered();
    const tbody = document.getElementById('hotels-tbody');
    const countEl = document.getElementById('hotels-count');

    if (countEl) countEl.textContent = hotels.length;
    if (!tbody) return;

    if (hotels.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i data-lucide="building-2"></i><h4>No hotels found</h4><p>Add your first hotel partner</p></div></td></tr>`;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = hotels.map(h => `
      <tr>
        <td>${this.esc(h.name)}</td>
        <td>${this.esc(h.city)}</td>
        <td>${this.esc(h.contact)}</td>
        <td>${this.esc(h.roomType)}</td>
        <td>₹${(h.ratePerNight || 0).toLocaleString('en-IN')}</td>
        <td><div class="stars">${this.renderStars(h.rating)}</div></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="Hotels.edit('${h.id}')" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
            <button class="btn-icon danger" onclick="App.confirmDelete('hotels','${h.id}','${this.esc(h.name)}')" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  getFiltered() {
    let hotels = Storage.getAll('hotels');
    if (this.filterCity !== 'All') {
      hotels = hotels.filter(h => h.city === this.filterCity);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      hotels = hotels.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
      );
    }
    return hotels;
  },

  getCities() {
    const hotels = Storage.getAll('hotels');
    return [...new Set(hotels.map(h => h.city))].sort();
  },

  populateCityFilter() {
    const select = document.getElementById('hotel-city-filter');
    if (!select) return;
    const cities = this.getCities();
    select.innerHTML = '<option value="All">All Cities</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  openModal(editId = null) {
    this.editingId = editId;
    const modal = document.getElementById('hotel-modal');
    const title = document.getElementById('hotel-modal-title');
    const form = document.getElementById('hotel-form');
    form.reset();

    if (editId) {
      title.textContent = 'Edit Hotel';
      const hotel = Storage.getById('hotels', editId);
      if (hotel) {
        form.hotelName.value = hotel.name;
        form.hotelCity.value = hotel.city || '';
        form.hotelContact.value = hotel.contact || '';
        form.hotelRoomType.value = hotel.roomType || '';
        form.hotelRate.value = hotel.ratePerNight || '';
        form.hotelRating.value = hotel.rating || 3;
        form.hotelNotes.value = hotel.notes || '';
      }
    } else {
      title.textContent = 'Add New Hotel';
    }
    App.openModal(modal);
  },

  save() {
    const form = document.getElementById('hotel-form');
    const data = {
      name: form.hotelName.value.trim(),
      city: form.hotelCity.value.trim(),
      contact: form.hotelContact.value.trim(),
      roomType: form.hotelRoomType.value.trim(),
      ratePerNight: parseFloat(form.hotelRate.value) || 0,
      rating: parseInt(form.hotelRating.value) || 3,
      notes: form.hotelNotes.value.trim(),
    };

    if (!data.name || !data.city) {
      App.toast('Please fill in hotel name and city', 'error');
      return;
    }

    if (this.editingId) {
      Storage.update('hotels', this.editingId, data);
      App.toast('Hotel updated successfully', 'success');
    } else {
      Storage.add('hotels', data);
      App.toast('Hotel added successfully', 'success');
    }

    App.closeAllModals();
    this.render();
    this.populateCityFilter();
    Dashboard.render();
  },

  edit(id) { this.openModal(id); },

  renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= rating ? '★' : '<span class="empty">★</span>';
    }
    return html;
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
