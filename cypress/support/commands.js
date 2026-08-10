const { authService } = require('./services');
const { byTest } = require('./selectors');

/**
 * Custom commands are deliberately few.
 *
 * A command earns its place only if it is used across several specs and hides
 * genuine plumbing. Anything page-specific belongs in a Page Object instead —
 * otherwise `cy.` becomes a dumping ground nobody can navigate.
 */

/**
 * Log in through the API and cache the session.
 *
 * cy.session restores cookies/localStorage instead of replaying the login on
 * every spec — the single biggest run-time saving in a suite this size.
 */
Cypress.Commands.add('loginByApi', (email, password) => {
  cy.session(
    ['user', email],
    () => {
      authService.login(email, password).then((token) => {
        cy.visit('/');
        cy.window().then((win) => {
          win.localStorage.setItem('auth-token', token);
        });
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.window().its('localStorage.auth-token').should('be.a', 'string');
      }
    }
  );
});

/** Register a fresh user via the API and return the credentials for reuse. */
Cypress.Commands.add('createUserByApi', (user) =>
  authService.register(user).then((res) => {
    expect(res.status, 'user registration').to.be.oneOf([200, 201]);
    return { ...user, id: res.body.id };
  })
);

/** Shorthand for the data-test convention. */
Cypress.Commands.add('getByTest', (hook, options) => cy.get(byTest(hook), options));

/** Assert an element is visible and carries the expected text, in one step. */
Cypress.Commands.add('shouldReadAs', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('be.visible').and('contain.text', text);
  return cy.wrap(subject);
});

/**
 * Fail the test if the browser console logged an error during the spec.
 * Cheap to run, and catches a class of defect that UI assertions never see.
 */
Cypress.Commands.add('assertNoConsoleErrors', () => {
  cy.get('@consoleError').then((stub) => {
    if (stub && stub.callCount > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(stub.args)}`);
    }
  });
});
