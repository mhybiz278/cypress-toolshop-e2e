const { invoicesPage, productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress } = require('../../support/helpers/dataFactory');

describe('Invoices', { tags: ['@account', '@regression'] }, () => {
  beforeEach(() => {
    cy.loginByApi(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));
  });

  it('lists an invoice after an order is placed', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
      checkoutPage.proceedAfterSignIn();
      checkoutPage.fillAddress(newAddress()).proceedToPayment();
      checkoutPage.selectPaymentMethod('cash-on-delivery').confirmOrder();
      checkoutPage.shouldShowPaymentSuccess();

      invoicesPage.visit();

      invoicesPage.shouldHaveInvoices();
    });
  });

  it('opens an invoice and shows its number', () => {
    invoicesPage.visit();
    invoicesPage.shouldHaveInvoices();

    invoicesPage.openFirstInvoice();

    invoicesPage.el('invoice-number').should('not.have.text', '');
    invoicesPage.el('total').should('exist');
  });

  it('is not reachable when signed out', () => {
    cy.clearAllLocalStorage();
    invoicesPage.visit();

    cy.location('pathname').should('contain', '/auth/login');
  });
});
