require('./commands');
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

beforeEach(() => {
  cy.intercept('GET', '**/products*').as('getProducts');
});
