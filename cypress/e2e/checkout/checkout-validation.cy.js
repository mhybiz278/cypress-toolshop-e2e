const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress, newCreditCard } = require('../../support/helpers/dataFactory');

describe('Checkout — validation', { tags: ['@checkout', '@regression'] }, () => {
  beforeEach(() => {
    cy.loginByApi(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
      checkoutPage.proceedAfterSignIn();
    });
  });

  it('will not advance past an incomplete address', () => {
    checkoutPage.fillAddress({ ...newAddress(), city: '' });
    checkoutPage.proceedToPayment();

    // Still on the address step: the payment selector must not be reachable.
    cy.getByTest('payment-method').should('not.exist');
  });

  it('requires a payment method to be chosen', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.confirmOrder();

    checkoutPage.el('payment-success-message').should('not.exist');
  });

  it('rejects an invalid credit card number', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.fillCreditCard(newCreditCard({ number: '1234' }));
    checkoutPage.confirmOrder();

    checkoutPage.el('payment-success-message').should('not.exist');
  });

  it('rejects an expired card', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.fillCreditCard(newCreditCard({ expiry: '01/2020' }));
    checkoutPage.confirmOrder();

    checkoutPage.el('payment-success-message').should('not.exist');
  });
});
