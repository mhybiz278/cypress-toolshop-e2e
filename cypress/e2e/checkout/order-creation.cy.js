const { productDetailPage, cartPage, checkoutPage, header } = require('../../support/pages');
const { productService, orderService } = require('../../support/services');
const { newAddress } = require('../../support/helpers/dataFactory');
const { signedInAsNewCustomer } = require('../../support/helpers/accounts');
const { stillPresent } = require('../../support/knownDefects');

/**
 * The one thing the rest of the checkout suite cannot assert for itself.
 *
 * "Payment success" on screen is the response to the *payment check*, not
 * proof that an order exists. Separating the two is the whole point of this
 * spec: the banner is the application's claim, the invoice is the fact.
 */
describe('Checkout — order creation', { tags: ['@checkout', '@smoke'] }, () => {
  beforeEach(() => {
    signedInAsNewCustomer();
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.proceedToCheckout();
      checkoutPage.proceedAfterSignIn();
      checkoutPage.fillAddress(newAddress()).proceedToPayment();
      checkoutPage.selectPaymentMethod('cash-on-delivery');
    });
  });

  it('shows a success message on the first confirmation without creating the order', () => {
    // TOOL-2104, Critical. The confirm handler reads the payment-check result
    // synchronously, before the request it just fired has come back, so the
    // first click always evaluates to "not yet paid" and the order is never
    // submitted. The success banner is painted by the response that arrives a
    // moment later — so the customer is told the order went through, and it
    // did not. Asserted as it behaves, and this test fails the day it is fixed.
    checkoutPage.confirmOrder();

    checkoutPage.shouldShowPaymentAccepted();

    orderService.invoices().then(({ body }) =>
      stillPresent('TOOL-2104', body.total, 0));
  });

  it('creates the order when the customer confirms a second time', () => {
    // The other half of TOOL-2104: nothing is wrong with the payload or the
    // endpoint, only with when the client decides to send it. A second click
    // finds the flag already set and the order is placed.
    checkoutPage.confirmOrder();
    checkoutPage.shouldShowPaymentAccepted();

    checkoutPage.confirmOrder();

    orderService.invoices().then(({ body }) => {
      expect(body.total, 'invoices for this customer').to.eq(1);
      expect(body.data[0].invoice_number, 'invoice number').to.be.a('string').and.not.be.empty;
    });
  });
});
