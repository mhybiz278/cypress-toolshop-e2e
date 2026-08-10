const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor() { super('/auth/login'); }

  login(email, password) {
    this.fill('email', email);
    this.fill('password', password);
    return this.click('login-submit');
  }

  submitEmpty() { return this.click('login-submit'); }

  goToRegister() { return this.click('register-link'); }
  goToForgotPassword() { return this.click('forgot-password-link'); }

  shouldShowLoginError(message) {
    this.el('login-error').should('be.visible').and('contain.text', message);
    return this;
  }

  shouldShowFieldError(field, message) {
    this.el(`${field}-error`).should('be.visible').and('contain.text', message);
    return this;
  }
}

module.exports = new LoginPage();
