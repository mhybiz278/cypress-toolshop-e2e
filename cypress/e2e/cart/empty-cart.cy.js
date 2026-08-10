const { cartPage, header, productDetailPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Empty cart', { tags: ['@cart', '@regression'] }, () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit('/');
  });

  it('shows no line items before anything is added', () => {
    header.goToCart();

    cartPage.lineItems.should('have.length', 0);
  });

  it('cannot proceed to checkout with an empty cart', () => {
    header.goToCart();

    cartPage.el('proceed-1').should('satisfy', ($el) => $el.is(':disabled') || $el.length === 0);
  });

  it('returns to the catalogue via continue shopping', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();

      cartPage.continueShopping();

      cy.location('pathname').should('eq', '/');
    });
  });
});
