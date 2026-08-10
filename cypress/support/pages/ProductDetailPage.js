const BasePage = require('./BasePage');

class ProductDetailPage extends BasePage {
  constructor() { super('/product'); }

  visitById(id) { cy.visit(`/product/${id}`); return this; }

  addToCart() { return this.click('add-to-cart'); }
  addToFavourites() { return this.click('add-to-favorites'); }

  setQuantity(qty) {
    this.el('quantity').clear().type(String(qty));
    return this;
  }

  increaseQuantity(times = 1) {
    Cypress._.times(times, () => this.click('increase-quantity'));
    return this;
  }

  decreaseQuantity(times = 1) {
    Cypress._.times(times, () => this.click('decrease-quantity'));
    return this;
  }

  name() { return this.el('product-name').invoke('text'); }

  /** @returns {Cypress.Chainable<number>} unit price as a number */
  unitPrice() {
    return this.el('unit-price').invoke('text').then((t) => Number(t.replace(/[^0-9.]/g, '')));
  }

  shouldBeOutOfStock() {
    this.el('out-of-stock').should('be.visible');
    this.el('add-to-cart').should('be.disabled');
    return this;
  }

  shouldHaveSpecs() {
    this.el('product-specs').should('be.visible');
    this.el('spec-row').should('have.length.greaterThan', 0);
    return this;
  }
}

module.exports = new ProductDetailPage();
