const BasePage = require('./BasePage');

class FavouritesPage extends BasePage {
  constructor() { super('/account/favorites'); }

  /**
   * The list is fetched after the route renders, so the delete control does not
   * exist yet when `visit()` returns. Waiting on the request the application
   * itself fires is the honest signal that the list is on screen — the default
   * command timeout is not a substitute, and on a slow response it expires
   * before the first row ever appears.
   */
  visit(options = {}) {
    super.visit(options);
    cy.wait('@favouritesLoaded');
    return this;
  }

  get items() { return this.elStartsWith('favorite-'); }

  removeFirst() {
    this.el('delete').first().click();
    return this;
  }

  shouldContain(productName) {
    this.el('product-name').should('contain.text', productName);
    return this;
  }

  shouldBeEmpty() {
    this.items.should('have.length', 0);
    return this;
  }
}

module.exports = new FavouritesPage();
