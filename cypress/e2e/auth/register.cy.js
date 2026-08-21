const { registerPage, loginPage, header } = require('../../support/pages');
const { newUser } = require('../../support/helpers/dataFactory');

describe('Registration', { tags: ['@auth', '@regression'] }, () => {
  beforeEach(() => {
    registerPage.visit();
  });

  it('registers a new customer who can then sign in', () => {
    const user = newUser();

    registerPage.register(user);
    cy.location('pathname').should('eq', '/auth/login');

    loginPage.login(user.email, user.password);
    header.shouldShowSignedIn();
  });

  it('rejects an email that is already registered', () => {
    // Registered here rather than borrowed from the sample data: the test owns
    // the collision it is asserting on, so it holds on an empty database too.
    const existing = newUser();
    cy.createUserByApi(existing);

    registerPage.visit().register(newUser({ email: existing.email }));

    registerPage.el('register-error').should('be.visible');
    cy.location('pathname').should('eq', '/auth/register');
  });

  it('flags every mandatory field when submitted empty', () => {
    registerPage.submitEmpty();

    ['first-name', 'last-name', 'dob', 'street', 'postal_code', 'city', 'state', 'phone', 'email', 'password']
      .forEach((field) => registerPage.el(`${field}-error`).should('be.visible'));
  });

  it('rejects a malformed email address', () => {
    registerPage.register(newUser({ email: 'not-an-email' }));

    registerPage.shouldShowFieldError('email', 'Email format is invalid');
  });

  it('enforces the password policy', () => {
    // Boundary: the policy requires a minimum length, so the failing case is
    // one character short rather than an arbitrarily tiny string.
    registerPage.register(newUser({ password: 'Ab1!' }));

    registerPage.el('password-error').should('be.visible');
  });
});
