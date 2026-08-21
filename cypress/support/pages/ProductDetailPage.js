const BasePage = require('./BasePage');

class ProductDetailPage extends BasePage {
  constructor() { super('/product'); }

  visitById(id) { cy.visit(`/product/${id}`); return this; }

  /**
   * Adding to the cart is asynchronous. Waiting for the application's own
   * request to complete means a spec can navigate straight to the cart without
   * racing it, and without an arbitrary sleep standing in for a real signal.
   */
  addToCart() {
    this.click('add-to-cart');
    cy.wait('@cartItemAdded').its('response.statusCode').should('be.oneOf', [200, 201]);
    return this;
  }
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
