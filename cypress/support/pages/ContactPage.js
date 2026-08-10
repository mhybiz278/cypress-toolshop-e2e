const BasePage = require('./BasePage');

class ContactPage extends BasePage {
  constructor() { super('/contact'); }

  sendMessage({ firstName, lastName, email, subject, message }) {
    this.fill('first-name', firstName);
    this.fill('last-name', lastName);
    this.fill('email', email);
    if (subject) this.el('subject').select(subject);
    this.fill('message', message);
    return this.click('contact-submit');
  }

  attachFile(fixturePath) {
    this.el('attachment').selectFile(fixturePath, { force: true });
    return this;
  }

  submitEmpty() { return this.click('contact-submit'); }

  shouldShowFieldError(field, message) {
    this.el(`${field}-error`).should('be.visible').and('contain.text', message);
    return this;
  }

  /** The success banner has no test hook, so match on the alert role instead. */
  shouldShowConfirmation() {
    cy.get('.alert-success, [role="alert"]').should('be.visible');
    return this;
  }
}

module.exports = new ContactPage();
