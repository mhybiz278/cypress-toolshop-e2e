const BasePage = require('./BasePage');

/** Step 1 of the checkout wizard — the cart contents. */
class CartPage extends BasePage {
  constructor() { super('/checkout'); }

  get lineItems() { return this.el('product-title'); }

  setQuantityForRow(rowIndex, qty) {
    this.el('product-quantity').eq(rowIndex).clear().type(`${qty}`).blur();
    return this;
  }

  /**
   * The delete control carries no data-test hook in the application, so it is
   * located structurally and isolated here — one brittle selector, one place.
   */
  removeRow(rowIndex) {
    cy.get('table tbody tr').eq(rowIndex).find('.btn-danger, [class*="trash"], button').last().click();
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

  shouldHaveRowCount(count) {
    this.lineItems.should('have.length', count);
    return this;
  }
}

module.exports = new CartPage();
