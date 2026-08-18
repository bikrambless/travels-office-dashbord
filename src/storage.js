// ===== Storage Manager =====
const Storage = {
  KEYS: {
    leads: 'travel_crm_leads',
    hotels: 'travel_crm_hotels',
    guides: 'travel_crm_guides',
    payments: 'travel_crm_payments',
    b2bPartners: 'travel_crm_b2b_partners',
    b2bBills: 'travel_crm_b2b_bills',
  },

  // Generic CRUD
  getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS[key])) || [];
    } catch { return []; }
  },

  save(key, data) {
    localStorage.setItem(this.KEYS[key], JSON.stringify(data));
  },

  add(key, item) {
    const list = this.getAll(key);
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    item.createdAt = new Date().toISOString();
    list.push(item);
    this.save(key, list);
    return item;
  },

  update(key, id, updates) {
    const list = this.getAll(key);
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.save(key, list);
      return list[idx];
    }
    return null;
  },

  remove(key, id) {
    const list = this.getAll(key).filter(i => i.id !== id);
    this.save(key, list);
  },

  getById(key, id) {
    return this.getAll(key).find(i => i.id === id) || null;
  },

  // Export all data
  exportData() {
    const data = {};
    Object.keys(this.KEYS).forEach(k => { data[k] = this.getAll(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_crm_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import data
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          Object.keys(this.KEYS).forEach(k => {
            if (data[k]) this.save(k, data[k]);
          });
          resolve(true);
        } catch (err) { reject(err); }
      };
      reader.readAsText(file);
    });
  },

  // Initialize demo data on first visit
  initDemo() {
    if (localStorage.getItem('travel_crm_initialized_v3')) return;

    const b2bPartners = [
      { id: 'b1', agencyName: 'Apex Travel Solutions', contactPerson: 'Vikram Malhotra', phone: '9811223344', email: 'apex@travels.com', city: 'Delhi', commission: 10, notes: 'Specializes in North India packages' },
      { id: 'b2', agencyName: 'Global Horizons Travels', contactPerson: 'Sunita Rao', phone: '9822334455', email: 'sunita@globalhorizons.in', city: 'Mumbai', commission: 12, notes: 'Provides luxury leisure leads' },
      { id: 'b3', agencyName: 'Southern Trails B2B', contactPerson: 'Karthik Raja', phone: '9833445566', email: 'karthik@southerntrails.com', city: 'Bengaluru', commission: 8, notes: 'Provides South India & Kerala leads' },
    ];

    const b2bBills = [
      { id: 'bb1', partnerId: 'b1', partnerName: 'Apex Travel Solutions', invoiceNo: 'INV-B2B-101', billDate: '2026-07-15', dueDate: '2026-08-15', totalAmount: 85000, paidAmount: 50000, pendingAmount: 35000, status: 'Partially Paid', notes: 'Manali & Shimla group booking commission & bill' },
      { id: 'bb2', partnerId: 'b2', partnerName: 'Global Horizons Travels', invoiceNo: 'INV-B2B-102', billDate: '2026-07-20', dueDate: '2026-08-20', totalAmount: 120000, paidAmount: 120000, pendingAmount: 0, status: 'Fully Paid', notes: 'Goa beach resort package invoice' },
      { id: 'bb3', partnerId: 'b3', partnerName: 'Southern Trails B2B', invoiceNo: 'INV-B2B-103', billDate: '2026-07-28', dueDate: '2026-08-28', totalAmount: 64000, paidAmount: 0, pendingAmount: 64000, status: 'Unpaid', notes: 'Kerala houseboat tour lead package' },
    ];

    const leads = [
      { id: 'l1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', destination: 'Manali', travelDate: '2026-08-15', passengers: 4, budget: 45000, status: 'New', b2bPartnerId: 'b1', b2bPartnerName: 'Apex Travel Solutions', notes: 'B2B Lead from Apex Travel', createdAt: '2026-07-20T10:00:00Z' },
      { id: 'l2', name: 'Priya Patel', phone: '9876543211', email: 'priya@email.com', destination: 'Goa', travelDate: '2026-09-01', passengers: 2, budget: 30000, status: 'Contacted', b2bPartnerId: 'b2', b2bPartnerName: 'Global Horizons Travels', notes: 'Honeymoon trip, wants beach resort', createdAt: '2026-07-18T10:00:00Z' },
      { id: 'l3', name: 'Amit Singh', phone: '9876543212', email: 'amit@email.com', destination: 'Ladakh', travelDate: '2026-08-20', passengers: 6, budget: 120000, status: 'Proposal', b2bPartnerId: '', b2bPartnerName: 'Direct Customer', notes: 'Group trip, needs bike rental', createdAt: '2026-07-15T10:00:00Z' },
      { id: 'l4', name: 'Sneha Reddy', phone: '9876543213', email: 'sneha@email.com', destination: 'Kerala', travelDate: '2026-08-05', tripStartDate: '2026-08-05', tripDurationDays: 5, assignedGuideId: 'g2', assignedGuideName: 'Joseph Thomas', driverDetails: 'Ramesh Taxi (Tempo Traveller HP-01-A-1234)', emergencyContact: '+91 98765 00000', hotelBookingCode: 'BB-9874 (Backwater Bliss Resort)', passengers: 3, budget: 55000, status: 'Ongoing', b2bPartnerId: 'b3', b2bPartnerName: 'Southern Trails B2B', notes: 'Houseboat + Luxury Resort', createdAt: '2026-07-10T10:00:00Z' },
      { id: 'l5', name: 'Vikram Joshi', phone: '9876543214', email: 'vikram@email.com', destination: 'Rajasthan', travelDate: '2026-09-15', passengers: 5, budget: 80000, status: 'Won', b2bPartnerId: '', b2bPartnerName: 'Direct Customer', notes: 'Heritage tour confirmed', createdAt: '2026-07-08T10:00:00Z' },
      { id: 'l6', name: 'Ananya Gupta', phone: '9876543215', email: 'ananya@email.com', destination: 'Shimla', travelDate: '2026-08-05', passengers: 2, budget: 25000, status: 'Lost', b2bPartnerId: 'b1', b2bPartnerName: 'Apex Travel Solutions', notes: 'Found cheaper option', createdAt: '2026-07-05T10:00:00Z' },
      { id: 'l7', name: 'Karan Mehta', phone: '9876543216', email: 'karan@email.com', destination: 'Andaman', travelDate: '2026-10-01', passengers: 4, budget: 95000, status: 'New', b2bPartnerId: '', b2bPartnerName: 'Direct Customer', notes: 'Wants scuba diving package', createdAt: '2026-07-24T10:00:00Z' },
      { id: 'l8', name: 'Monika Santham', phone: '7047162430', email: 'monika@email.com', destination: 'Thimphu Paro Punakha', travelDate: '2026-08-04', tripStartDate: '2026-08-04', tripDurationDays: 7, assignedGuideId: 'g1', assignedGuideName: 'Ravi Kumar', driverDetails: 'Tashi Driver (Bhutan Cruiser Ph: 9811224455)', emergencyContact: '+91 98111 22334', hotelBookingCode: 'TH-502 (Thimphu Palace & Spa)', passengers: 4, budget: 80000, status: 'Ongoing', b2bPartnerId: '', b2bPartnerName: 'Direct Customer', notes: 'Bhutan cultural tour package', createdAt: '2026-07-26T12:13:48Z' },
    ];

    const hotels = [
      { id: 'h1', name: 'Mountain View Resort', city: 'Manali', contact: '01902-252525', ratePerNight: 3500, roomType: 'Deluxe', rating: 4, notes: 'Best view rooms on 3rd floor' },
      { id: 'h2', name: 'Ocean Breeze Hotel', city: 'Goa', contact: '0832-242424', ratePerNight: 4500, roomType: 'Suite', rating: 5, notes: 'Beachfront property, pool access' },
      { id: 'h3', name: 'Royal Heritage Inn', city: 'Jaipur', contact: '0141-232323', ratePerNight: 5000, roomType: 'Heritage Room', rating: 5, notes: 'Palace style rooms, rooftop dinner' },
      { id: 'h4', name: 'Backwater Bliss', city: 'Alleppey', contact: '0477-212121', ratePerNight: 6000, roomType: 'Houseboat', rating: 4, notes: 'AC houseboat, meals included' },
      { id: 'h5', name: 'Pine Valley Lodge', city: 'Shimla', contact: '0177-262626', ratePerNight: 2800, roomType: 'Standard', rating: 3, notes: 'Budget friendly, near Mall Road' },
      { id: 'h6', name: 'Leh Grand Hotel', city: 'Leh', contact: '01982-252020', ratePerNight: 4000, roomType: 'Deluxe', rating: 4, notes: 'Oxygen support available, heated rooms' },
    ];

    const guides = [
      { id: 'g1', name: 'Ravi Kumar', phone: '9988776601', languages: 'Hindi, English', ratePerDay: 1500, status: 'Available', specialization: 'Trekking & Adventure' },
      { id: 'g2', name: 'Joseph Thomas', phone: '9988776602', languages: 'English, Malayalam', ratePerDay: 1800, status: 'On Trip', specialization: 'Backwater Tours' },
      { id: 'g3', name: 'Tenzin Dorje', phone: '9988776603', languages: 'Hindi, English, Ladakhi', ratePerDay: 2000, status: 'Available', specialization: 'High Altitude Treks' },
      { id: 'g4', name: 'Sunil Rajput', phone: '9988776604', languages: 'Hindi, English, Rajasthani', ratePerDay: 1200, status: 'On Trip', specialization: 'Heritage & Cultural Tours' },
      { id: 'g5', name: 'Maria Fernandes', phone: '9988776605', languages: 'English, Hindi, Konkani', ratePerDay: 1400, status: 'Leave', specialization: 'Beach & Water Sports' },
    ];

    const payments = [
      { id: 'p1', leadId: 'l4', leadName: 'Sneha Reddy', packageCost: 55000, advancePaid: 25000, balance: 30000, status: 'Partially Paid', paymentMethod: 'UPI', paymentDate: '2026-07-12', notes: 'Balance due before travel' },
      { id: 'p2', leadId: 'l5', leadName: 'Vikram Joshi', packageCost: 80000, advancePaid: 80000, balance: 0, status: 'Fully Paid', paymentMethod: 'Bank Transfer', paymentDate: '2026-07-10', notes: 'Full payment received' },
      { id: 'p3', leadId: 'l3', leadName: 'Amit Singh', packageCost: 120000, advancePaid: 40000, balance: 80000, status: 'Partially Paid', paymentMethod: 'Cash', paymentDate: '2026-07-20', notes: 'Second installment due Aug 5' },
    ];

    this.save('b2bPartners', b2bPartners);
    this.save('b2bBills', b2bBills);
    this.save('leads', leads);
    this.save('hotels', hotels);
    this.save('guides', guides);
    this.save('payments', payments);
    localStorage.setItem('travel_crm_initialized_v3', 'true');
  }
};
