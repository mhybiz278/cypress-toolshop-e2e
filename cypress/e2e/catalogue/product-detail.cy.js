const { productDetailPage } = require('../../support/pages');
const { productService } = require('../../support/services');
const { closeTo } = require('../../support/helpers/money');

describe('Product detail', { tags: ['@catalogue', '@smoke'] }, () => {
  it('shows the name, price and description the API holds', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);

      productDetailPage.el('product-name').should('contain.text', product.name);
      productDetailPage.el('product-description').should('contain.text', product.description.slice(0, 30));
      productDetailPage.unitPrice().then((shown) => closeTo(shown, Number(product.price)));
    });
  });

  it('increments and decrements the quantity', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);

      productDetailPage.increaseQuantity(2);
      productDetailPage.el('quantity').should('have.value', '3');

      productDetailPage.decreaseQuantity(1);
      productDetailPage.el('quantity').should('have.value', '2');
    });
  });

  it('does not allow the quantity to drop below one', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);

      productDetailPage.decreaseQuantity(3);

      productDetailPage.el('quantity').should('have.value', '1');
    });
  });

  it('renders the specification table', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);
      productDetailPage.shouldHaveSpecs();
    });
  });

  it('disables adding to cart for an out-of-stock product', () => {
    productService.list().then((res) => {
      const outOfStock = res.body.data.find((p) => !p.in_stock);
      if (!outOfStock) {
        cy.log('No out-of-stock product available — skipping');
        return;
      }
      productDetailPage.visitById(outOfStock.id);
      productDetailPage.shouldBeOutOfStock();
    });
  });
});
