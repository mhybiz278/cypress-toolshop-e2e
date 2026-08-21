const { cartPage, header, productDetailPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Empty cart', { tags: ['@cart', '@regression'] }, () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit('/');
  });

  it('does not offer a cart link until something is in the cart', () => {
    header.el('nav-cart').should('not.exist');
    header.cartQuantity().should('eq', 0);
  });

  it('shows no line items before anything is added', () => {
    // Navigated directly: the header cart link is not rendered for an empty
    // cart, and the route still has to behave if a customer bookmarks it.
    cartPage.visit();

    cartPage.el('proceed-1').should('not.exist');
    cy.get('body').find(cartPage.selector('product-title')).should('have.length', 0);
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
