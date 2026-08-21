const BasePage = require('./BasePage');

/**
 * Steps 2-4 of the checkout wizard (sign-in, address, payment).
 *
 * The wizard headers carry no test hooks, so progression is driven by the
 * per-step proceed buttons — which is also how a user moves through it.
 */
class CheckoutPage extends BasePage {
  constructor() { super('/checkout'); }

  // --- Step 2: sign in -------------------------------------------------
  signIn(email, password) {
    this.fill('email', email);
    this.fill('password', password);
    return this.click('login-submit');
  }

  continueAsGuest({ email, firstName, lastName }) {
    // The guest form sits behind a Bootstrap tab that carries no test hook.
    // The structural selector is quarantined here, in one method, rather than
    // spread across the three guest specs.
    cy.get('a[href="#guest-tab"]').click();
    this.fill('guest-email', email);
    this.fill('guest-first-name', firstName);
    this.fill('guest-last-name', lastName);
    return this.click('guest-submit');
  }

  proceedAfterSignIn() { return this.click('proceed-2'); }
  proceedAsGuest() { return this.click('proceed-2-guest'); }

  // --- Step 3: billing address ----------------------------------------
  /**
   * Country and postcode are the only address fields a customer really
   * chooses. The application looks the postcode up and fills street, city and
   * state itself, and the API re-runs that same lookup when the order is
   * placed — rejecting any address whose city or state contradicts it. So a
   * test that types its own city is driving the form into a state no real
   * customer can reach, and the order it places will 422.
   */
  fillAddress(address) {
    if (address.country) this.select('country', address.country);
    this.fill('postal_code', address.postalCode);
    this.fill('house_number', address.houseNumber);
    return this.waitForPostcodeLookup();
  }

  /** The lookup has finished when it has populated the locality fields. */
  waitForPostcodeLookup() {
    this.el('postcode-lookup-loading').should('not.exist');
    this.el('city').should('not.have.value', '');
    this.el('state').should('not.have.value', '');
    return this;
  }

  proceedToPayment() { return this.click('proceed-3'); }

  // --- Step 4: payment -------------------------------------------------
  /** @param {'bank-transfer'|'cash-on-delivery'|'credit-card'|'buy-now-pay-later'|'gift-card'} method */
  selectPaymentMethod(method) {
    this.el('payment-method').select(method);
    return this;
  }

  fillBankTransfer({ bankName, accountName, accountNumber }) {
    this.fill('bank_name', bankName);
    this.fill('account_name', accountName);
    this.fill('account_number', accountNumber);
    return this;
  }

  fillCreditCard({ number, expiry, cvv, holder }) {
    this.fill('credit_card_number', number);
    this.fill('expiration_date', expiry);
    this.fill('cvv', cvv);
    this.fill('card_holder_name', holder);
    return this;
  }

  fillGiftCard({ number, validationCode }) {
    this.fill('gift_card_number', number);
    this.fill('validation_code', validationCode);
    return this;
  }

  selectInstalments(months) {
    this.el('monthly_installments').select(String(months));
    return this;
  }

  confirmOrder() { return this.click('finish'); }

  /** The address step is still the one on screen. */
  shouldBeOnAddressStep() {
    this.el('proceed-3').should('be.visible');
    return this;
  }

  /**
   * The wizard disables the confirm button while the payment form is invalid,
   * so "cannot submit" is asserted on the control the customer would press.
   */
  shouldNotAllowConfirmation() {
    this.el('finish').should('be.disabled');
    return this;
  }

  /**
   * The banner reports the outcome of the *payment check*, not that an order
   * was created — those are two different requests, and only the first has
   * happened when this appears. `checkout/order-creation.cy.js` covers the
   * difference; nothing else in the suite should read this as "order placed".
   */
  shouldShowPaymentAccepted() {
    this.el('payment-success-message', { timeout: 15000 }).should('be.visible');
    return this;
  }

  shouldShowPaymentError(message) {
    const assertion = this.el('payment-error-message').should('be.visible');
    if (message) assertion.and('contain.text', message);
    return this;
  }
}

module.exports = new CheckoutPage();
