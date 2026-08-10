const BasePage = require('./BasePage');

class InvoicesPage extends BasePage {
  constructor() { super('/account/invoices'); }

  /** Invoice rows carry no test hooks — table structure is isolated here. */
  get rows() { return cy.get('table tbody tr'); }

  openFirstInvoice() { this.rows.first().find('a').last().click(); return this; }

  nextPage() { return this.click('pagination-next'); }

  shouldHaveInvoices() { this.rows.should('have.length.greaterThan', 0); return this; }

  invoiceNumber() { return this.el('invoice-number').invoke('text'); }
}

module.exports = new InvoicesPage();
