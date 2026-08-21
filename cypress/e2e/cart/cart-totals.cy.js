const { productDetailPage, cartPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Cart totals', { tags: ['@cart', '@regression'] }, () => {
  it('sums the line prices into the cart total', () => {
    // Two plain products, one each. The application only renders a *subtotal*
    // row once a discount applies, so with nothing discounted the total is the
    // figure to check — and it must be the sum of the lines, to the cent.
    productService.list().then((res) => {
      const [first, second] = res.body.data
        .filter((p) => p.in_stock && !p.is_rental && !p.is_eco_friendly && !p.is_location_offer);

      productDetailPage.visitById(first.id).addToCart();
      productDetailPage.visitById(second.id).addToCart();
      header.goToCart();

      cartPage.el('cart-subtotal').should('not.exist');
      cartPage.linePrice(0).then((line1) => {
        cartPage.linePrice(1).then((line2) => {
          cartPage.total().should('be.closeTo', line1 + line2, 0.01);
        });
      });
    });
  });

  it('recalculates the total when a line quantity changes', () => {
    // A stale-total bug looks like this: the line updates, the total keeps the
    // value it had before the change, and the customer is charged the old
    // amount. Changing the quantity after the cart is on screen is the case
    // that catches it.
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();

      cartPage.setQuantityForRow(0, 4);

      cartPage.shouldHaveTotal(Number(product.price) * 4);
    });
  });

  it('multiplies unit price by quantity on a line', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).increaseQuantity(4).addToCart();
      header.goToCart();

      cartPage.linePrice(0).should('be.closeTo', Number(product.price) * 5, 0.01);
    });
  });

  it('never shows a negative or zero total for a populated cart', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();

      cartPage.total().should('be.greaterThan', 0);
    });
  });
});
