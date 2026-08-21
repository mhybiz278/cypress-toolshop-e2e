const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress, newBankDetails } = require('../../support/helpers/dataFactory');
const { signedInAsNewCustomer } = require('../../support/helpers/accounts');

describe('Checkout — registered customer', { tags: ['@checkout', '@smoke'] }, () => {
  beforeEach(() => {
    signedInAsNewCustomer();
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
    });
  });

  it('completes an order end to end', () => {
    cartPage.proceedToCheckout();
    checkoutPage.proceedAfterSignIn();

    checkoutPage.fillAddress(newAddress());
    checkoutPage.proceedToPayment();

    checkoutPage.selectPaymentMethod('bank-transfer');
    checkoutPage.fillBankTransfer(newBankDetails());
    checkoutPage.confirmOrder();

    checkoutPage.shouldShowPaymentAccepted();
  });

  it('empties the cart once the order is placed', () => {
    cartPage.proceedToCheckout();
    checkoutPage.proceedAfterSignIn();
    checkoutPage.fillAddress(newAddress()).proceedToPayment();
    checkoutPage.selectPaymentMethod('cash-on-delivery').confirmOrder();
    checkoutPage.shouldShowPaymentAccepted();

    cy.visit('/');

    header.shouldHaveCartQuantity(0);
  });
});
