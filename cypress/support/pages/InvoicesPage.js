const BasePage = require('./BasePage');

class InvoicesPage extends BasePage {
  constructor() { super('/account/invoices'); }

  /** Invoice rows carry no test hooks — table structure is isolated here. */
  get rows() { return cy.get('table tbody tr'); }

  openFirstInvoice() { this.rows.first().find('a').last().click(); return this; }

  nextPage() { return this.click('pagination-next'); }

  shouldHaveInvoices() { this.rows.should('have.length.greaterThan', 0); return this; }

  /** An empty list renders the table without rows, not without the table. */
  shouldBeEmpty() {
    cy.get('body').find('table tbody tr').should('have.length', 0);
    return this;
  }

  /** The detail screen renders every field as a readonly input, not as text. */
  invoiceNumber() { return this.el('invoice-number').invoke('val'); }

  /**
   * Three different fields on the invoice detail screen carry
   * `data-test="total"` — subtotal, discount and total — so the hook cannot
   * identify one of them. The id is the only thing that can, and the fallback
   * is quarantined here rather than repeated in the specs.
   */
  total() { return cy.get('input#total').invoke('val'); }
}

module.exports = new InvoicesPage();
