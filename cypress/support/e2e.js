require('./commands');
require('./a11y');

/**
 * Tag filtering. Every describe block carries tags (@smoke, @regression, @api,
 * @a11y ...); this is what makes them mean something at the command line:
 *
 *   npm run test:smoke        the pre-merge gate
 *   npx cypress run --env grepTags=@checkout
 */
require('@cypress/grep').register();
require('cypress-mochawesome-reporter/register');

/**
 * Spy on console.error for every test so `cy.assertNoConsoleErrors()` has
 * something to assert against.
 */
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').as('consoleError');
});

/**
 * The application is an Angular SPA; a ResizeObserver notice is emitted by the
 * layout on some viewports and is not a product defect. Everything else must
 * still fail the test — blanket-ignoring uncaught exceptions hides real bugs.
 */
Cypress.on('uncaught:exception', (err) => {
  if (/ResizeObserver loop/.test(err.message)) return false;
  return true;
});

/**
 * Paging through the catalogue does not stamp the page's state container the
 * way search, sort and filter do, so the products request is the only honest
 * signal that a new page has arrived. Aliased once here rather than per spec.
 */
beforeEach(() => {
  // No method filter: the catalogue is fetched with the HTTP QUERY method,
  // not GET (see docs/ARCHITECTURE.md).
  cy.intercept({ url: /\/products(\/search)?(\?.*)?$/ }).as('getProducts');

  // Cart writes. A page object waits on the request the application itself
  // fires rather than on a sleep, so "the item is in the cart" means the
  // server said so — not that 500ms elapsed. `POST /carts` creates the cart
  // and `POST /carts/{id}` adds a line; only the second is a real add.
  cy.intercept('POST', /\/carts\/[^/]+$/).as('cartItemAdded');
  cy.intercept('PUT', /\/carts\/.+\/product\/quantity$/).as('cartQuantityChanged');
  cy.intercept('DELETE', /\/carts\/.+\/product\//).as('cartItemRemoved');

  // Account writes, for the same reason: assert on the outcome only once the
  // application has actually been told about the change.
  cy.intercept('POST', '**/users/change-password').as('passwordChanged');
});
