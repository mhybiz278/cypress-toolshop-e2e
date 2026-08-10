const BasePage = require('./BasePage');

class RegisterPage extends BasePage {
  constructor() { super('/auth/register'); }

  /** @param {import('../helpers/dataFactory').NewUser} user */
  register(user) {
    this.fill('first-name', user.firstName);
    this.fill('last-name', user.lastName);
    this.fill('dob', user.dateOfBirth);
    this.fill('street', user.street);
    this.fill('postal_code', user.postalCode);
    this.fill('city', user.city);
    this.fill('state', user.state);
    if (user.country) this.select('country', user.country);
    this.fill('phone', user.phone);
    this.fill('email', user.email);
    this.fill('password', user.password);
    return this.click('register-submit');
  }

  submitEmpty() { return this.click('register-submit'); }

  shouldShowFieldError(field, message) {
    this.el(`${field}-error`).should('be.visible').and('contain.text', message);
    return this;
  }

  shouldShowRegisterError(message) {
    this.el('register-error').should('be.visible').and('contain.text', message);
    return this;
  }
}

module.exports = new RegisterPage();
