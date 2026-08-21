const { contactPage } = require('../../support/pages');
const { newContactMessage } = require('../../support/helpers/dataFactory');

describe('Contact form', { tags: ['@content', '@regression'] }, () => {
  beforeEach(() => {
    contactPage.visit();
  });

  it('submits a complete enquiry', () => {
    contactPage.sendMessage(newContactMessage());

    contactPage.shouldShowConfirmation();
  });

  it('flags every mandatory field when submitted empty', () => {
    contactPage.submitEmpty();

    ['first-name', 'last-name', 'email', 'subject', 'message']
      .forEach((field) => contactPage.el(`${field}-error`).should('be.visible'));
  });

  it('rejects a malformed email address', () => {
    contactPage.sendMessage(newContactMessage({ email: 'nope@' }));

    contactPage.shouldShowFieldError('email', 'Email format is invalid');
  });

  it('enforces the minimum message length', () => {
    contactPage.sendMessage(newContactMessage({ message: 'Too short' }));

    contactPage.el('message-error').should('be.visible');
  });
});
