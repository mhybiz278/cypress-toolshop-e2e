const { invoicesPage } = require('../../support/pages');
const { orderService } = require('../../support/services');
const { signedInAsNewCustomer } = require('../../support/helpers/accounts');

/**
 * The order is seeded over the API rather than driven through the five-screen
 * checkout wizard. These specs are about the invoice screen: paying eight
 * seconds a test to reach it, and inheriting every checkout failure as an
 * invoice failure, would tell a reader nothing about invoices.
 */
describe('Invoices', { tags: ['@account', '@regression'] }, () => {
  beforeEach(() => {
    signedInAsNewCustomer();
  });

  it('shows nothing for a customer who has never ordered', () => {
    invoicesPage.visit();

    invoicesPage.shouldBeEmpty();
  });

  it('lists an invoice after an order is placed', () => {
    orderService.placeOrder().then((invoice) => {
      invoicesPage.visit();

      invoicesPage.shouldHaveInvoices();
      invoicesPage.rows.should('contain.text', invoice.invoice_number);
    });
  });

  it('opens an invoice and shows the number and total the API holds', () => {
    orderService.placeOrder().then((invoice) => {
      invoicesPage.visit();

      invoicesPage.openFirstInvoice();

      invoicesPage.invoiceNumber().should('eq', invoice.invoice_number);
      invoicesPage.total().should('contain', Number(invoice.total).toFixed(2));
    });
  });

  it('is not reachable when signed out', () => {
    cy.clearAllLocalStorage();
    invoicesPage.visit();

    cy.location('pathname').should('contain', '/auth/login');
  });
});
