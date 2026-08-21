const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');
const { newAddress, newUser } = require('../../support/helpers/dataFactory');

describe('Checkout — guest', { tags: ['@checkout', '@regression'] }, () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
    });
  });

  it('completes an order without an account', () => {
    const guest = newUser();

    checkoutPage.continueAsGuest({
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName
    });
    checkoutPage.proceedAsGuest();

    checkoutPage.fillAddress(newAddress()).proceedToPayment();
    checkoutPage.selectPaymentMethod('cash-on-delivery').confirmOrder();

    checkoutPage.shouldShowPaymentAccepted();
  });

  it('requires the guest email before continuing', () => {
    const guest = newUser();

    checkoutPage.continueAsGuest({ email: '', firstName: guest.firstName, lastName: guest.lastName });

    checkoutPage.el('guest-email-error').should('be.visible');
  });

  it('rejects a malformed guest email', () => {
    const guest = newUser();

    checkoutPage.continueAsGuest({ email: 'guest@', firstName: guest.firstName, lastName: guest.lastName });

    checkoutPage.el('guest-email-error').should('be.visible');
  });
});
