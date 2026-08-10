const BasePage = require('./BasePage');

class ProductListPage extends BasePage {
  constructor() { super('/'); }

  get products() { return this.elStartsWith('product-'); }

  search(term) {
    this.fill('search-query', term);
    return this.click('search-submit');
  }

  resetSearch() { return this.click('search-reset'); }

  sortBy(value) {
    this.el('sort').select(value);
    return this.waitForResults();
  }

  filterByCategory(categoryId) {
    this.el(`category-${categoryId}`).check({ force: true });
    return this.waitForResults();
  }

  filterByBrand(brandId) {
    this.el(`brand-${brandId}`).check({ force: true });
    return this.waitForResults();
  }

  nextPage() { this.click('pagination-next'); return this.waitForResults(); }
  previousPage() { this.click('pagination-prev'); return this.waitForResults(); }

  openProductByName(name) {
    this.el('product-name').contains(name).click();
    return this;
  }

  openFirstProduct() {
    this.products.first().click();
    return this;
  }

  /**
   * The listing renders a state container whose data-test IS the state name,
   * so waiting on 'loaded' is a real signal from the app rather than cy.wait().
   */
  waitForResults() {
    this.el('loaded', { timeout: 15000 }).should('exist');
    return this;
  }

  /** @returns {Cypress.Chainable<string[]>} visible product names, in order */
  productNames() {
    return this.el('product-name').then(($els) => Cypress._.map($els, (e) => e.innerText.trim()));
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
