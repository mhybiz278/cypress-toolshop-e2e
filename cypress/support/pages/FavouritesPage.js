const BasePage = require('./BasePage');

class FavouritesPage extends BasePage {
  constructor() { super('/account/favorites'); }

  get items() { return this.elStartsWith('favorite-'); }

  removeFirst() { this.el('delete').first().click(); return this; }

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
