const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress, newCreditCard, newBankDetails } = require('../../support/helpers/dataFactory');

/**
 * Data-driven: one scenario per payment method rather than five near-identical
 * copies. Adding a method to the product means adding a row here.
 */
const METHODS = [
  { value: 'cash-on-delivery', label: 'Cash on delivery', fill: () => {} },
  { value: 'bank-transfer', label: 'Bank transfer', fill: () => checkoutPage.fillBankTransfer(newBankDetails()) },
  { value: 'credit-card', label: 'Credit card', fill: () => checkoutPage.fillCreditCard(newCreditCard()) },
  { value: 'gift-card', label: 'Gift card', fill: () => checkoutPage.fillGiftCard({ number: 'GC1234567', validationCode: '1234' }) },
  { value: 'buy-now-pay-later', label: 'Buy now pay later', fill: () => checkoutPage.selectInstalments(6) }
];

describe('Checkout — payment methods', { tags: ['@checkout', '@regression'] }, () => {
  beforeEach(() => {
    cy.loginByApi(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
      checkoutPage.proceedAfterSignIn();
      checkoutPage.fillAddress(newAddress()).proceedToPayment();
    });
  });

  METHODS.forEach(({ value, label, fill }) => {
    it(`completes an order paying by ${label}`, () => {
      checkoutPage.selectPaymentMethod(value);
      fill();
      checkoutPage.confirmOrder();

      checkoutPage.shouldShowPaymentSuccess();
    });
  });

  it('shows only the fields belonging to the selected method', () => {
    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.el('credit_card_number').should('be.visible');
    cy.getByTest('bank_name').should('not.exist');

    checkoutPage.selectPaymentMethod('bank-transfer');
    checkoutPage.el('bank_name').should('be.visible');
    cy.getByTest('credit_card_number').should('not.exist');
  });
});
