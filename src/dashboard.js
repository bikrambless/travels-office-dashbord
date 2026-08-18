// ===== Dashboard Module =====
const Dashboard = {
  chartInstances: {},

  render() {
    const leads = Storage.getAll('leads');
    const payments = Storage.getAll('payments');
    const hotels = Storage.getAll('hotels');
    const guides = Storage.getAll('guides');
    const b2bPartners = Storage.getAll('b2bPartners');
    const b2bBills = Storage.getAll('b2bBills');

    const activeLeads = leads.filter(l => l.status !== 'Lost' && l.status !== 'Won').length;
    const wonLeads = leads.filter(l => l.status === 'Won').length;
    const totalCollected = payments.reduce((s, p) => s + (p.advancePaid || 0), 0);
    const totalPending = payments.reduce((s, p) => s + (p.balance || 0), 0);
    const availableGuides = guides.filter(g => g.status === 'Available').length;

    const b2bPending = b2bBills.reduce((s, b) => s + (parseFloat(b.pendingAmount) || 0), 0);

    // Update stat values
    const statActiveLeads = document.getElementById('stat-active-leads');
    const statWonLeads = document.getElementById('stat-won-leads');
    const statCollected = document.getElementById('stat-collected');
    const statPending = document.getElementById('stat-pending');
    const statHotels = document.getElementById('stat-hotels');
    const statGuides = document.getElementById('stat-guides');
    const statB2bPartners = document.getElementById('stat-b2b-partners');
    const statB2bPending = document.getElementById('stat-b2b-pending');

    if (statActiveLeads) statActiveLeads.textContent = activeLeads;
    if (statWonLeads) statWonLeads.textContent = wonLeads;
    if (statCollected) statCollected.textContent = '₹' + totalCollected.toLocaleString('en-IN');
    if (statPending) statPending.textContent = '₹' + totalPending.toLocaleString('en-IN');
    if (statHotels) statHotels.textContent = hotels.length;
    if (statGuides) statGuides.textContent = availableGuides + '/' + guides.length;
    if (statB2bPartners) statB2bPartners.textContent = b2bPartners.length;
    if (statB2bPending) statB2bPending.textContent = '₹' + b2bPending.toLocaleString('en-IN');

    this.renderCharts(leads, payments);
  },

  renderCharts(leads, payments) {
    // Destroy old instances
    Object.values(this.chartInstances).forEach(c => c.destroy());
    this.chartInstances = {};

    // Lead Pipeline Doughnut
    const statusCounts = {};
    ['New', 'Contacted', 'Proposal', 'Ongoing', 'Won', 'Lost'].forEach(s => {
      statusCounts[s] = leads.filter(l => l.status === s).length;
    });

    const ctxPipeline = document.getElementById('chart-pipeline');
    if (ctxPipeline) {
      this.chartInstances.pipeline = new Chart(ctxPipeline.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: ['#38bdf8', '#818cf8', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { family: 'Outfit', size: 12 },
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
              }
            }
          }
        }
      });
    }

    // Payment Bar Chart
    const totalCost = payments.reduce((s, p) => s + (p.packageCost || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.advancePaid || 0), 0);
    const totalRemaining = payments.reduce((s, p) => s + (p.balance || 0), 0);

    const ctxPayment = document.getElementById('chart-payments');
    if (ctxPayment) {
      this.chartInstances.payments = new Chart(ctxPayment.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Total Package', 'Collected', 'Pending'],
          datasets: [{
            data: [totalCost, totalPaid, totalRemaining],
            backgroundColor: [
              'rgba(99,102,241,0.7)',
              'rgba(16,185,129,0.7)',
              'rgba(245,158,11,0.7)',
            ],
            borderColor: ['#6366f1', '#10b981', '#f59e0b'],
            borderWidth: 1,
            borderRadius: 8,
            barPercentage: 0.5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => '₹' + ctx.raw.toLocaleString('en-IN')
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(148,163,184,0.08)' },
              ticks: {
                color: '#64748b',
                font: { family: 'Outfit', size: 11 },
                callback: (v) => '₹' + (v / 1000).toFixed(0) + 'k'
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } }
            }
          }
        }
      });
    }
  }
};
