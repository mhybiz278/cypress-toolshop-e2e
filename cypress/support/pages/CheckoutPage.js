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
    this.fill('guest-email', email);
    this.fill('guest-first-name', firstName);
    this.fill('guest-last-name', lastName);
    return this.click('guest-submit');
  }

  proceedAfterSignIn() { return this.click('proceed-2'); }
  proceedAsGuest() { return this.click('proceed-2-guest'); }

  // --- Step 3: billing address ----------------------------------------
  fillAddress(address) {
    if (address.country) this.select('country', address.country);
    this.fill('street', address.street);
    this.fill('postal_code', address.postalCode);
    this.fill('city', address.city);
    this.fill('state', address.state);
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

  shouldShowPaymentSuccess() {
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
