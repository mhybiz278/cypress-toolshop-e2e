const { favouritesPage, productDetailPage } = require('../../support/pages');
const { productService, favouriteService } = require('../../support/services');
const { newUser } = require('../../support/helpers/dataFactory');

describe('Favourites', { tags: ['@account', '@regression'] }, () => {
  beforeEach(() => {
    const user = newUser();
    cy.createUserByApi(user).then((created) => {
      cy.loginByApi(created.email, created.password);
      favouriteService.clearAll();
    });
  });

  it('adds a product to favourites from the product page', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToFavourites();

      favouritesPage.visit();
      favouritesPage.shouldContain(product.name);
    });
  });

  it('removes a product from favourites', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToFavourites();
      favouritesPage.visit();

      favouritesPage.removeFirst();

      favouritesPage.shouldBeEmpty();
    });
  });

  it('shows an empty list for a new account', () => {
    favouritesPage.visit();

    favouritesPage.shouldBeEmpty();
  });

  it('does not duplicate a product added to favourites twice', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToFavourites();
      cy.reload();
      productDetailPage.addToFavourites();

      favouritesPage.visit();
      favouritesPage.items.should('have.length', 1);
    });
  });
});
