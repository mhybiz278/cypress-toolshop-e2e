const { productDetailPage, cartPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Adding to the cart', { tags: ['@cart', '@smoke'] }, () => {
  it('adds a single product and updates the cart badge', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);

      productDetailPage.addToCart();

      header.cartQuantity().should('eq', 1);
      header.goToCart();
      cartPage.shouldContainProduct(product.name);
    });
  });

  it('adds a chosen quantity in one action', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);

      productDetailPage.increaseQuantity(2).addToCart();

      header.cartQuantity().should('eq', 3);
    });
  });

  it('merges a repeat add of the same product into one line', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);
      productDetailPage.addToCart();
      cy.reload();
      productDetailPage.addToCart();

      header.goToCart();
      cartPage.shouldHaveRowCount(1);
      header.cartQuantity().should('eq', 2);
    });
  });

  it('keeps two different products on separate lines', () => {
    productService.list().then((res) => {
      const [first, second] = res.body.data.filter((p) => p.in_stock && !p.is_rental);

      productDetailPage.visitById(first.id).addToCart();
      productDetailPage.visitById(second.id).addToCart();

      header.goToCart();
      cartPage.shouldHaveRowCount(2);
    });
  });
});
