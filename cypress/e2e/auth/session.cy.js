const { header, profilePage, loginPage } = require('../../support/pages');

describe('Session handling', { tags: ['@auth', '@regression'] }, () => {
  it('signs the user out and clears access to account pages', () => {
    cy.loginByApi(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));
    cy.visit('/account');

    header.signOut();

    header.shouldShowSignedOut();
    cy.location('pathname').should('eq', '/');
  });

  it('redirects an anonymous user away from a protected page', () => {
    cy.clearAllLocalStorage();
    cy.visit('/account/profile');

    cy.location('pathname').should('contain', '/auth/login');
  });

  it('keeps the user signed in across a page reload', () => {
    cy.loginByApi(Cypress.env('seededCustomerEmail'), Cypress.env('seededCustomerPassword'));
    profilePage.visit();

    cy.reload();

    header.shouldShowSignedIn();
    profilePage.el('email').should('have.value', Cypress.env('seededCustomerEmail'));
  });

  it('does not restore a session from a tampered token', () => {
    cy.visit('/');
    cy.window().then((win) => win.localStorage.setItem('auth-token', 'clearly.invalid.token'));

    cy.visit('/account/profile');

    cy.location('pathname').should('contain', '/auth/login');
    loginPage.el('login-form').should('be.visible');
  });
});
