const BasePage = require('./BasePage');

/**
 * The navigation bar is a component, not a page — it is composed into page
 * objects rather than inherited from, so no page pretends to *be* the header.
 */
class HeaderComponent extends BasePage {
  goToHome() { return this.click('nav-home'); }
  goToSignIn() { return this.click('nav-sign-in'); }
  goToCart() { return this.click('nav-cart'); }

  openUserMenu() { return this.click('nav-menu'); }

  goToMyAccount() { this.openUserMenu(); return this.click('nav-my-account'); }
  goToFavourites() { this.openUserMenu(); return this.click('nav-my-favorites'); }
  goToProfile() { this.openUserMenu(); return this.click('nav-my-profile'); }
  goToInvoices() { this.openUserMenu(); return this.click('nav-my-invoices'); }
  signOut() { this.openUserMenu(); return this.click('nav-sign-out'); }

  goToCategory(category) {
    this.click('nav-categories');
    return this.click(`nav-${category}`);
  }

  /** @returns {Cypress.Chainable<number>} items currently in the cart badge */
  cartQuantity() {
    return this.el('cart-quantity').invoke('text').then((t) => Number(t.trim() || 0));
  }

  shouldShowSignedIn() {
    this.el('nav-menu').should('be.visible');
    this.el('nav-sign-in').should('not.exist');
    return this;
  }

  shouldShowSignedOut() {
    this.el('nav-sign-in').should('be.visible');
    return this;
  }
}

module.exports = new HeaderComponent();
