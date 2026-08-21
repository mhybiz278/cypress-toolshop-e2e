const BasePage = require('./BasePage');

/** Step 1 of the checkout wizard — the cart contents. */
class CartPage extends BasePage {
  constructor() { super('/checkout'); }

  get lineItems() { return this.el('product-title'); }

  setQuantityForRow(rowIndex, qty) {
    this.el('product-quantity').eq(rowIndex).clear().type(`${qty}`).blur();
    cy.wait('@cartQuantityChanged');
    return this;
  }

  /**
   * The delete control carries no data-test hook in the application, so it is
   * located structurally and isolated here — one brittle selector, one place.
   */
  removeRow(rowIndex) {
    cy.get('table tbody tr').eq(rowIndex).find('a.btn-danger').last().click();
    cy.wait('@cartItemRemoved');
    return this;
  }

  proceedToCheckout() { return this.click('proceed-1'); }
  continueShopping() { return this.click('continue-shopping'); }

  linePrice(rowIndex) {
    return this.el('line-price').eq(rowIndex).invoke('text').then((t) => Number(t.replace(/[^0-9.]/g, '')));
  }

  subtotal() {
    return this.el('cart-subtotal').invoke('text').then((t) => Number(t.replace(/[^0-9.]/g, '')));
  }

  total() {
    return this.el('cart-total').invoke('text').then((t) => Number(t.replace(/[^0-9.]/g, '')));
  }

  shouldContainProduct(name) {
    this.lineItems.should('contain.text', name);
    return this;
  }

  /**
   * Changing a quantity fires an update and then a refetch, so the total lands
   * a moment after the request completes. A retrying assertion is the honest
   * way to express "the total settles on this figure".
   */
  shouldHaveTotal(expected, delta = 0.01) {
    this.el('cart-total').should(($el) => {
      const actual = Number($el.text().replace(/[^0-9.]/g, ''));
      expect(actual, 'cart total').to.be.closeTo(expected, delta);
    });
    return this;
  }

  shouldHaveRowCount(count) {
    this.lineItems.should('have.length', count);
    return this;
  }
}

module.exports = new CartPage();
