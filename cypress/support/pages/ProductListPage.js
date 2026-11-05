const BasePage = require('./BasePage');
const { ATTR } = require('../selectors');

class ProductListPage extends BasePage {
  constructor() { super('/'); }

  /**
   * A product card is the anchor whose hook is `product-{id}`.
   *
   * Restricting to `a` matters: `product-name`, `product-price` and
   * `product-title` all share the same prefix, so a bare prefix match would
   * count three elements per product and every length assertion in the
   * catalogue specs would be quietly wrong.
   */
  get products() { return cy.get(`a[${ATTR}^="product-"]`); }

  search(term) {
    this.fill('search-query', term);
    this.click('search-submit');
    return this.waitForState('search_completed');
  }

  resetSearch() {
    this.click('search-reset');
    return this.waitForProducts();
  }

  sortBy(value) {
    this.el('sort').select(value);
    return this.waitForState('sorting_completed');
  }

  filterByCategory(categoryId) {
    this.el(`category-${categoryId}`).check({ force: true });
    return this.waitForState('filter_completed');
  }

  filterByBrand(brandId) {
    this.el(`brand-${brandId}`).check({ force: true });
    return this.waitForState('filter_completed');
  }

  clearBrandFilter(brandId) {
    this.el(`brand-${brandId}`).uncheck({ force: true });
    return this.waitForState('filter_completed');
  }

  nextPage() { this.click('pagination-next'); return this.waitForPage(); }
  previousPage() { this.click('pagination-prev'); return this.waitForPage(); }

  openProductByName(name) {
    this.el('product-name').contains(name).click();
    return this;
  }

  openFirstProduct() {
    this.products.first().click();
    return this;
  }

  /**
   * The listing renders a state container whose `data-test` value *is* the
   * current state — `filter_completed`, `search_completed`,
   * `sorting_completed`. Waiting on it is a real signal from the application
   * rather than an arbitrary sleep.
   */
  waitForState(state) {
    cy.get(`[${ATTR}="${state}"]`, { timeout: 15000 }).should('exist');
    return this;
  }

  /**
   * The state container is only stamped by a user action, so on first load the
   * signal is the grid itself having rendered.
   */
  waitForProducts() {
    this.products.should('have.length.greaterThan', 0);
    return this;
  }

  /**
   * Paging does not stamp the state container, so the signal is the products
   * request the page fires. Aliased once in support/e2e.js.
   */
  waitForPage() {
    cy.wait('@getProducts');
    return this;
  }

  /** @returns {Cypress.Chainable<string[]>} visible product names, in order */
  productNames() {
    return this.el('product-name').then(($els) => Cypress._.map($els, (e) => e.innerText.trim()));
  }

  /**
   * Assert over the visible product names *with retries*.
   *
   * `productNames()` ends in `.then()`, which Cypress never retries: it
   * snapshots the DOM once and any `.should()` chained after it re-runs the
   * assertion against that frozen array, never re-querying the page. After
   * `nextPage()` that snapshot is taken when the products *response* lands but
   * before Angular has re-rendered, so the assertion compares page one with
   * page one and the suite reports a pagination defect that is not there.
   *
   * `cy.get(...).should(fn)` re-queries on every attempt, which is what
   * anything that settles asynchronously needs.
   */
  shouldHaveProductNames(assertFn) {
    this.el('product-name').should(($els) => {
      assertFn(Cypress._.map($els, (e) => e.innerText.trim()));
    });
    return this;
  }

  /** @returns {Cypress.Chainable<number[]>} visible prices as numbers, in order */
  productPrices() {
    return this.el('product-price').then(($els) =>
      Cypress._.map($els, (e) => Number(e.innerText.replace(/[^0-9.]/g, '')))
    );
  }

  shouldShowNoResults() {
    this.el('no-results').should('be.visible');
    return this;
  }

  shouldShowResultCount(count) {
    this.el('search-result-count').should('contain.text', count);
    return this;
  }
}

module.exports = new ProductListPage();
