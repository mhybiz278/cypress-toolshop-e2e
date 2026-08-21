const { loginPage, header } = require('../../support/pages');
const { newUser } = require('../../support/helpers/dataFactory');

describe('Sign in', { tags: ['@auth', '@smoke'] }, () => {
  beforeEach(() => {
    loginPage.visit();
  });

  it('signs in with valid credentials and shows the account menu', () => {
    const user = newUser();
    cy.createUserByApi(user);

    loginPage.visit().login(user.email, user.password);

    cy.location('pathname').should('eq', '/account');
    header.shouldShowSignedIn();
  });

  it('rejects a valid email with the wrong password', () => {
    // A freshly minted account, not the one that ships with the sample data:
    // the application locks a customer out after three failed attempts, so a
    // negative test on a shared account poisons every spec that runs later.
    const user = newUser();
    cy.createUserByApi(user);

    loginPage.visit().login(user.email, 'definitely-not-the-password');

    loginPage.shouldShowLoginError('Invalid email or password');
    cy.location('pathname').should('eq', '/auth/login');
  });

  it('rejects an email that was never registered', () => {
    const { email, password } = newUser();

    loginPage.login(email, password);

    loginPage.shouldShowLoginError('Invalid email or password');
  });

  it('does not reveal whether the email exists', () => {
    // Distinct error text for "unknown user" versus "wrong password" is a user
    // enumeration weakness: it turns the sign-in form into an oracle for which
    // addresses hold accounts. Both paths must read identically.
    const registered = newUser();
    cy.createUserByApi(registered);

    loginPage.visit().login(registered.email, 'wrong-password');
    loginPage.el('login-error').invoke('text').then((knownUserError) => {
      loginPage.visit().login(newUser().email, 'wrong-password');
      loginPage.el('login-error').invoke('text').should('eq', knownUserError);
    });
  });

  it('locks the account after three failed attempts', () => {
    // This lockout is what makes a shared test account unusable. Asserting it
    // directly is far better than meeting it as a cascade of unexplained
    // failures in the cart and checkout suites two jobs later.
    const user = newUser();
    cy.createUserByApi(user);

    Cypress._.times(3, () => {
      loginPage.visit().login(user.email, 'wrong-password');
      loginPage.el('login-error').should('be.visible');
    });

    loginPage.visit().login(user.email, user.password);

    loginPage.shouldShowLoginError('Account locked');
    cy.location('pathname').should('eq', '/auth/login');
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
