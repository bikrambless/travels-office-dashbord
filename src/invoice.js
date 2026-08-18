// ===== Invoice & PDF Generator Module =====
const Invoice = {
  currentData: null,
  currentType: null, // 'customer' or 'b2b'

  openCustomerInvoice(paymentId) {
    const payment = Storage.getById('payments', paymentId);
    if (!payment) {
      App.toast('Payment record not found', 'error');
      return;
    }

    const lead = Storage.getById('leads', payment.leadId) || {};

    let invoiceNo = payment.invoiceNo;
    if (!invoiceNo) {
      invoiceNo = 'INV-CUST-' + Math.floor(1000 + Math.random() * 9000);
      Storage.update('payments', paymentId, { invoiceNo });
      payment.invoiceNo = invoiceNo;
    }

    this.currentType = 'customer';
    this.currentData = {
      invoiceNo: payment.invoiceNo,
      invoiceDate: payment.paymentDate || new Date().toISOString().slice(0, 10),
      dueDate: lead.travelDate || payment.paymentDate || '-',
      billToName: payment.leadName || lead.name || 'Valued Customer',
      billToSub: lead.phone ? `Phone: ${lead.phone}` : '',
      billToEmail: lead.email || '',
      typeLabel: 'CUSTOMER INVOICE',
      destination: lead.destination || 'Travel Package',
      travelDate: lead.travelDate || '-',
      passengers: lead.passengers || 1,
      packageCost: parseFloat(payment.packageCost) || 0,
      advancePaid: parseFloat(payment.advancePaid) || 0,
      balance: parseFloat(payment.balance) || 0,
      status: payment.status || 'Unpaid',
      paymentMethod: payment.paymentMethod || 'UPI',
      notes: payment.notes || 'Thank you for choosing TravelDesk for your travel booking!'
    };

    this.renderInvoiceModal();
  },

  openB2bInvoice(billId) {
    const bill = Storage.getById('b2bBills', billId);
    if (!bill) {
      App.toast('B2B bill record not found', 'error');
      return;
    }

    const partner = Storage.getById('b2bPartners', bill.partnerId) || {};

    this.currentType = 'b2b';
    this.currentData = {
      invoiceNo: bill.invoiceNo || ('INV-B2B-' + bill.id.slice(-5).toUpperCase()),
      invoiceDate: bill.billDate || new Date().toISOString().slice(0, 10),
      dueDate: bill.dueDate || '-',
      billToName: bill.partnerName || partner.agencyName || 'B2B Travel Partner',
      billToSub: partner.contactPerson ? `Attn: ${partner.contactPerson} (${partner.phone || ''})` : '',
      billToEmail: partner.email || '',
      typeLabel: 'B2B PARTNER INVOICE',
      destination: 'B2B Agent Booking & Commission Invoice',
      travelDate: bill.dueDate || '-',
      passengers: '-',
      packageCost: parseFloat(bill.totalAmount) || 0,
      advancePaid: parseFloat(bill.paidAmount) || 0,
      balance: parseFloat(bill.pendingAmount) || 0,
      status: bill.status || 'Unpaid',
      paymentMethod: 'Bank Transfer / UPI',
      notes: bill.notes || partner.notes || 'B2B Partner Agent Billing Statement.'
    };

    this.renderInvoiceModal();
  },

  renderInvoiceModal() {
    const data = this.currentData;
    if (!data) return;

    const paper = document.getElementById('invoice-paper');
    if (!paper) return;

    const statusColorClass = data.status === 'Fully Paid' ? 'status-paid' : data.status === 'Partially Paid' ? 'status-partial' : 'status-unpaid';

    paper.innerHTML = `
      <div class="inv-header">
        <div class="inv-brand">
          <div class="inv-logo"><i data-lucide="plane" style="width:28px;height:28px"></i></div>
          <div>
            <h2>TravelDesk Agency</h2>
            <p>Premium Travel Management & CRM</p>
            <p style="font-size:0.75rem;color:#64748b;margin-top:2px">GSTIN: 07AAAAA0000A1Z5 | Phone: +91 98765 43210</p>
          </div>
        </div>
        <div class="inv-meta">
          <div class="inv-badge">${data.typeLabel}</div>
          <h3 class="inv-no">#${data.invoiceNo}</h3>
          <p><strong>Date:</strong> ${data.invoiceDate}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
      </div>

      <div class="inv-parties">
        <div class="inv-party-box">
          <span class="inv-label">Billed To</span>
          <h4>${this.esc(data.billToName)}</h4>
          <p>${this.esc(data.billToSub)}</p>
          ${data.billToEmail ? `<p>${this.esc(data.billToEmail)}</p>` : ''}
        </div>
        <div class="inv-party-box" style="text-align:right">
          <span class="inv-label">Payment Status</span>
          <div class="inv-status-stamp ${statusColorClass}">${data.status.toUpperCase()}</div>
          <p style="font-size:0.8rem;margin-top:6px;color:#475569">Method: <strong>${this.esc(data.paymentMethod)}</strong></p>
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Travel Date / Info</th>
            <th>Pax</th>
            <th style="text-align:right">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong style="color:#0f172a">${this.esc(data.destination)}</strong>
              <div style="font-size:0.78rem;color:#64748b">Travel booking & arrangement package</div>
            </td>
            <td>${data.travelDate}</td>
            <td>${data.passengers}</td>
            <td style="text-align:right;font-weight:600;color:#0f172a">₹${(data.packageCost).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div class="inv-summary">
        <div class="inv-bank-info">
          <h5>Bank & UPI Details</h5>
          <p><strong>Account Name:</strong> TravelDesk Agency Pvt Ltd</p>
          <p><strong>Bank:</strong> HDFC Bank | <strong>A/C:</strong> 50200012345678</p>
          <p><strong>IFSC Code:</strong> HDFC0001234 | <strong>UPI ID:</strong> traveldesk@upi</p>
        </div>
        <div class="inv-totals">
          <div class="inv-row"><span>Total Package Cost:</span><strong>₹${(data.packageCost).toLocaleString('en-IN')}</strong></div>
          <div class="inv-row green"><span>Amount Paid:</span><strong>₹${(data.advancePaid).toLocaleString('en-IN')}</strong></div>
          <div class="inv-row total"><span>Pending Balance:</span><strong>₹${(data.balance).toLocaleString('en-IN')}</strong></div>
        </div>
      </div>

      ${data.notes ? `
      <div class="inv-notes">
        <strong>Notes & Terms:</strong>
        <p>${this.esc(data.notes)}</p>
      </div>` : ''}

      <div class="inv-footer">
        <p>Computer Generated Invoice — Valid without signature</p>
        <p>Thank you for choosing TravelDesk CRM!</p>
      </div>
    `;

    lucide.createIcons();
    App.openModal(document.getElementById('invoice-modal'));
  },

  downloadPDF() {
    const element = document.getElementById('invoice-paper');
    if (!element) return;

    if (!window.html2pdf) {
      App.toast('PDF library loading, printing instead...', 'info');
      window.print();
      return;
    }

    App.toast('Generating PDF document...', 'info');

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Invoice_${this.currentData?.invoiceNo || 'TravelDesk'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      App.toast('PDF Downloaded successfully!', 'success');
    }).catch(err => {
      console.error(err);
      window.print();
    });
  },

  printInvoice() {
    window.print();
  },

  shareWhatsApp() {
    const d = this.currentData;
    if (!d) return;

    const text = `*Invoice from TravelDesk Agency*%0A` +
      `*Invoice #:* ${d.invoiceNo}%0A` +
      `*Billed To:* ${d.billToName}%0A` +
      `*Package/Trip:* ${d.destination}%0A` +
      `*Total Cost:* ₹${d.packageCost.toLocaleString('en-IN')}%0A` +
      `*Amount Paid:* ₹${d.advancePaid.toLocaleString('en-IN')}%0A` +
      `*Pending Balance:* ₹${d.balance.toLocaleString('en-IN')}%0A` +
      `*Status:* ${d.status}%0A` +
      `----------------------------%0A` +
      `Thank you for doing business with TravelDesk!`;

    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  },

  shareEmail() {
    const d = this.currentData;
    if (!d) return;

    const subject = encodeURIComponent(`Invoice #${d.invoiceNo} - TravelDesk Agency`);
    const body = encodeURIComponent(
      `Dear ${d.billToName},\n\n` +
      `Please find the invoice summary #${d.invoiceNo} from TravelDesk Agency:\n\n` +
      `Destination/Details: ${d.destination}\n` +
      `Total Cost: ₹${d.packageCost.toLocaleString('en-IN')}\n` +
      `Amount Paid: ₹${d.advancePaid.toLocaleString('en-IN')}\n` +
      `Pending Balance: ₹${d.balance.toLocaleString('en-IN')}\n` +
      `Payment Status: ${d.status}\n\n` +
      `Bank Details for Payment:\n` +
      `Bank: HDFC Bank | Account: 50200012345678 | IFSC: HDFC0001234 | UPI: traveldesk@upi\n\n` +
      `Warm regards,\nTravelDesk Team`
    );

    window.open(`mailto:${d.billToEmail || ''}?subject=${subject}&body=${body}`, '_blank');
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
