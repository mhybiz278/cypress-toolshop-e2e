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

  /**
   * The cart link and its badge are only rendered once the cart holds
   * something, so an empty cart is an absent element rather than a zero — and
   * the badge updates a moment after the request that changed it. Both are
   * handled here, in a retrying assertion, so a spec never has to know either.
   */
  shouldHaveCartQuantity(expected) {
    if (expected === 0) {
      this.el('nav-cart').should('not.exist');
      return this;
    }
    this.el('cart-quantity').should('have.text', String(expected));
    return this;
  }

  /**
   * A one-shot read for the rare case a spec needs the number itself rather
   * than an assertion about it. Prefer `shouldHaveCartQuantity` — it retries.
   *
   * @returns {Cypress.Chainable<number>} items currently in the cart badge
   */
  cartQuantity() {
    return cy.get('body').then(($body) => {
      const $badge = $body.find(this.selector('cart-quantity'));
      return $badge.length ? Number($badge.text().trim() || 0) : 0;
    });
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
