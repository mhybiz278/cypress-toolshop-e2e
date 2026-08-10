const { loginPage, header } = require('../../support/pages');
const { newUser } = require('../../support/helpers/dataFactory');

describe('Sign in', { tags: ['@auth', '@smoke'] }, () => {
  beforeEach(() => loginPage.visit());

  it('signs in with valid credentials and shows the account menu', () => {
    loginPage.login(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));

    cy.location('pathname').should('eq', '/account');
    header.shouldShowSignedIn();
  });

  it('rejects a valid email with the wrong password', () => {
    loginPage.login(Cypress.env('seededCustomerEmail'), 'definitely-not-the-password');

    loginPage.shouldShowLoginError('Invalid email or password');
    cy.location('pathname').should('eq', '/auth/login');
  });

  it('rejects an email that was never registered', () => {
    const { email, password } = newUser();
    loginPage.login(email, password);

    loginPage.shouldShowLoginError('Invalid email or password');
  });

  it('does not reveal whether the email exists', () => {
    // Distinct error text for "unknown user" vs "wrong password" is a user
    // enumeration weakness. Both paths must read identically.
    loginPage.login(Cypress.env('seededCustomerEmail'), 'wrong-password');
    loginPage.el('login-error').invoke('text').then((knownUserError) => {
      loginPage.visit();
      loginPage.login('nobody.here@example.test', 'wrong-password');
      loginPage.el('login-error').invoke('text').should('eq', knownUserError);
    });
  });

  it('validates both fields when the form is submitted empty', () => {
    loginPage.submitEmpty();

    loginPage.shouldShowFieldError('email', 'Email is required');
    loginPage.shouldShowFieldError('password', 'Password is required');
  });

  it('links out to registration and password recovery', () => {
    loginPage.goToRegister();
    cy.location('pathname').should('eq', '/auth/register');

    loginPage.visit().goToForgotPassword();
    cy.location('pathname').should('contain', 'forgot-password');
  });
});
