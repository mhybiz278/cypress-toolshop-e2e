const { byTest, byTestStartsWith } = require('../selectors');

/**
 * Shared behaviour for every page object.
 *
 * Page Objects expose intent ("login as", "add the first product to the cart")
 * and never assertions about business outcomes — those live in the specs, so a
 * failure message points at the test's intent rather than at framework internals.
 */
class BasePage {
  /** @param {string} path route this page lives at, e.g. '/auth/login' */
  constructor(path = '/') {
    this.path = path;
  }

  visit(options = {}) {
    cy.visit(this.path, options);
    return this;
  }

  /** The CSS selector for a hook, for the rare case a raw one is needed. */
  selector(hook) {
    return byTest(hook);
  }

  /** Scoped element lookup by data-test hook. */
  el(hook, options = {}) {
    return cy.get(byTest(hook), options);
  }

  /** For Angular-interpolated hooks like product-{{id}}. */
  elStartsWith(prefix, options = {}) {
    return cy.get(byTestStartsWith(prefix), options);
  }

  /**
   * Type into a field only when a value is supplied, so the same helper can
   * drive both "fill everything" and "omit one field to test validation".
   */
  fill(hook, value) {
    if (value === undefined || value === null || value === '') return this;
    this.el(hook).clear().type(value, { delay: 0 });
    return this;
  }

  /**
   * Emptying a field is not the same as omitting it: `fill` skips a blank
   * value on purpose, which leaves whatever the application pre-populated in
   * place. Clearing is explicit.
   */
  clearField(hook) {
    this.el(hook).clear().blur();
    return this;
  }

  /**
   * `be.enabled` only means something for form controls, and most of this
   * application's navigation is anchors — where that assertion can never pass.
   * Visible-and-not-disabled is the actionable state that applies to both, and
   * it still fails with a readable message instead of a detached-element error
   * three retries later.
   */
  click(hook) {
    this.el(hook).should('be.visible').and('not.be.disabled').click();
    return this;
  }

  select(hook, value) {
    this.el(hook).select(value);
    return this;
  }

  shouldBeOnPath(path = this.path) {
    cy.location('pathname').should('eq', path);
    return this;
  }
}

module.exports = BasePage;
