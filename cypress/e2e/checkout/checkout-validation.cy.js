const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress, newCreditCard } = require('../../support/helpers/dataFactory');
const { signedInAsNewCustomer } = require('../../support/helpers/accounts');

/**
 * The wizard keeps every step in the DOM and reveals one at a time, so
 * "cannot proceed" is a question of what is *visible* and what is *enabled* —
 * asserting on existence would pass against a hidden step and prove nothing.
 */
describe('Checkout — validation', { tags: ['@checkout', '@regression'] }, () => {
  beforeEach(() => {
    signedInAsNewCustomer();
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
      checkoutPage.proceedAfterSignIn();
    });
  });

  it('will not advance past an incomplete address', () => {
    // The address step arrives pre-filled from the customer's saved address,
    // so the field has to be cleared rather than merely left out of the data.
    checkoutPage.fillAddress(newAddress());
    checkoutPage.clearField('city');

    // The wizard disables the step's own proceed button while the address is
    // incomplete, so payment is unreachable rather than merely unsubmittable.
    checkoutPage.el('proceed-3').should('be.disabled');
    checkoutPage.shouldBeOnAddressStep();
    cy.getByTest('payment-method').should('not.be.visible');
  });

  it('will not place an order before a payment method is chosen', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.shouldNotAllowConfirmation();
    checkoutPage.el('payment-success-message').should('not.exist');
  });

  it('rejects a credit card number that is not 16 digits', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.fillCreditCard(newCreditCard({ number: '1234' }));

    checkoutPage.shouldNotAllowConfirmation();
    checkoutPage.el('payment-success-message').should('not.exist');
  });

  it('rejects an expired card', () => {
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.fillCreditCard(newCreditCard({ expiry: '01/2020' }));

    checkoutPage.shouldNotAllowConfirmation();
    checkoutPage.el('payment-success-message').should('not.exist');
  });

  it('accepts the same card once the expiry is corrected', () => {
    // The mirror of the case above. Without it, a form that is *always*
    // un-submittable would pass every negative test in this file.
    checkoutPage.fillAddress(newAddress()).proceedToPayment();

    checkoutPage.selectPaymentMethod('credit-card');
    checkoutPage.fillCreditCard(newCreditCard({ expiry: '01/2020' }));
    checkoutPage.shouldNotAllowConfirmation();

    checkoutPage.fill('expiration_date', '12/2030');

    checkoutPage.el('finish').should('not.be.disabled');
  });
});
