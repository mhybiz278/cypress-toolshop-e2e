const { productDetailPage, cartPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Cart totals', { tags: ['@cart', '@regression'] }, () => {
  it('sums line prices into the subtotal', () => {
    productService.list().then((res) => {
      const [first, second] = res.body.data.filter((p) => p.in_stock && !p.is_rental);

      productDetailPage.visitById(first.id).addToCart();
      productDetailPage.visitById(second.id).addToCart();
      header.goToCart();

      cartPage.linePrice(0).then((line1) => {
        cartPage.linePrice(1).then((line2) => {
          cartPage.subtotal().should('be.closeTo', line1 + line2, 0.01);
        });
      });
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
