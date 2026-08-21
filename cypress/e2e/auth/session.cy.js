const { header, profilePage } = require('../../support/pages');
const { signedInAsNewCustomer } = require('../../support/helpers/accounts');

describe('Session handling', { tags: ['@auth', '@regression'] }, () => {
  it('signs the user out and clears access to account pages', () => {
    signedInAsNewCustomer();
    cy.visit('/account');

    header.signOut();

    header.shouldShowSignedOut();
    cy.location('pathname').should('contain', '/auth/login');

    // Signing out has to revoke access, not just change the menu.
    cy.visit('/account/profile');
    cy.location('pathname').should('contain', '/auth/login');
  });

  it('redirects an anonymous user away from a protected page', () => {
    cy.clearAllLocalStorage();
    cy.visit('/account/profile');

    cy.location('pathname').should('contain', '/auth/login');
  });

  it('keeps the user signed in across a page reload', () => {
    signedInAsNewCustomer().then((user) => {
      profilePage.visit();

      cy.reload();

      header.shouldShowSignedIn();
      profilePage.el('email').should('have.value', user.email);
    });
  });

  it('does not restore a session from a tampered token', () => {
    cy.visit('/');
    cy.window().then((win) => win.localStorage.setItem('auth-token', 'clearly.invalid.token'));

    cy.visit('/account/profile');

    // Assert the security property, not the landing URL. A rejected token
    // leaves the router cancelling navigation, and where the address bar ends
    // up afterwards is an Angular implementation detail that varies between
    // runs — asserting it would buy a flaky test and prove nothing. What must
    // hold is that no account data is served and the app treats the visitor
    // as anonymous.
    cy.getByTest('page-title').should('not.exist');
    cy.getByTest('email').should('not.exist');
    header.shouldShowSignedOut();
  });
});
