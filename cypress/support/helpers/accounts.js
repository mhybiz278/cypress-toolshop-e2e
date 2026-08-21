const { newUser } = require('./dataFactory');
const { authService } = require('../services');

/**
 * Mint a customer over the API and put the browser into their session.
 *
 * Every spec that needs to be signed in calls this rather than reaching for the
 * account that ships with the sample data. That account is shared, and the
 * application locks a customer out after three failed sign-ins — so a single
 * negative auth test using it takes the cart, checkout and account suites down
 * with it on the next run. A per-spec account also makes the CI matrix safe to
 * run in parallel.
 *
 * @param {object} overrides fields to force onto the generated user
 * @returns {Cypress.Chainable<object>} the created user, including credentials
 */
const signedInAsNewCustomer = (overrides = {}) => {
  const user = newUser(overrides);
  return cy.createUserByApi(user).then((created) => {
    // Two sessions, deliberately. `cy.loginByApi` puts the *browser* into the
    // customer's session via cy.session, which restores a cached token without
    // replaying the login. The service layer keeps its own bearer token, and
    // authenticating it here — rather than relying on the cy.session block
    // having run — is what lets a spec seed state over HTTP as that customer.
    cy.loginByApi(created.email, created.password);
    authService.login(created.email, created.password);
    return cy.wrap(created, { log: false });
  });
};

module.exports = { signedInAsNewCustomer };
