const { productDetailPage, cartPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Updating the cart', { tags: ['@cart', '@regression'] }, () => {
  beforeEach(() => {
    productService.firstPurchasable().then((product) => {
      cy.wrap(product).as('product');
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
    });
  });

  it('recalculates the line total when the quantity changes', () => {
    cy.get('@product').then((product) => {
      cartPage.setQuantityForRow(0, 3);

      cartPage.linePrice(0).should('be.closeTo', Number(product.price) * 3, 0.01);
      header.shouldHaveCartQuantity(3);
    });
  });

  it('removes a line item', () => {
    cartPage.removeRow(0);

    cartPage.lineItems.should('have.length', 0);
  });

  it('rejects a quantity of zero', () => {
    cartPage.setQuantityForRow(0, 0);

    // Either the field refuses the value or the row is removed — what must not
    // happen is a zero-quantity line surviving into checkout.
    cartPage.el('product-quantity').first().invoke('val').then((val) => {
      expect(Number(val), 'quantity must not be zero').to.be.greaterThan(0);
    });
  });

  it('keeps the cart after a page reload', () => {
    cy.reload();

    cartPage.lineItems.should('have.length', 1);
    header.shouldHaveCartQuantity(1);
  });
});
