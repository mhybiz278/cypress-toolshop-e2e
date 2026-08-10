const { loginPage } = require('../../support/pages');
const { newUser } = require('../../support/helpers/dataFactory');

describe('Password recovery', { tags: ['@auth', '@regression'] }, () => {
  beforeEach(() => {
    loginPage.visit();
    loginPage.goToForgotPassword();
  });

  it('accepts a known email address', () => {
    cy.getByTest('email').type(Cypress.env('seededCustomerEmail'));
    cy.getByTest('forgot-password-submit').click();

    cy.getByTest('forgot-password-form').should('exist');
  });

  it('requires an email address', () => {
    cy.getByTest('forgot-password-submit').click();

    cy.getByTest('email-error').should('be.visible');
  });

  it('gives the same response for an unknown address', () => {
    // Same reasoning as the login enumeration check: recovery must not confirm
    // which addresses hold accounts.
    cy.getByTest('email').type(newUser().email);
    cy.getByTest('forgot-password-submit').click();

    cy.getByTest('email-error').should('not.exist');
  });
});
