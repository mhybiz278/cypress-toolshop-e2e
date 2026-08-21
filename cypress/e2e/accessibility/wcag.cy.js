const { productListPage, productDetailPage, cartPage, loginPage, registerPage, header } = require('../../support/pages');
const { productService } = require('../../support/services');

/**
 * Accessibility on the paths a customer cannot avoid.
 *
 * Scoped to WCAG 2.1 A and AA, and to serious and critical impacts. axe reports
 * dozens of minor findings on any real page; a gate that fires on all of them
 * gets muted within a week, and a muted gate protects nothing. These are the
 * failures that stop somebody buying a hammer with a screen reader.
 *
 * Baselines live in cypress/fixtures/a11y-baseline.json: each entry is a rule
 * the application currently breaks on that page, recorded with a count. New
 * violations fail the build. A violation that gets fixed also fails it, so the
 * baseline shrinks rather than rots — the same contract as knownDefects.js.
 */
const WCAG = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } };
const BLOCKING = { includedImpacts: ['serious', 'critical'] };

describe('Accessibility', { tags: ['@a11y', '@regression'] }, () => {
  beforeEach(() => {
    cy.fixture('a11y-baseline.json').as('baseline');
  });

  const auditPage = (page) => {
    cy.injectAxe();
    cy.get('@baseline').then((baseline) => {
      cy.checkA11yAgainstBaseline(page, baseline[page] || {}, WCAG, BLOCKING);
    });
  };

  it('the product listing meets WCAG 2.1 AA on serious and critical rules', () => {
    productListPage.visit().waitForProducts();

    auditPage('catalogue');
  });

  it('the product detail page meets WCAG 2.1 AA on serious and critical rules', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id);
      productDetailPage.el('add-to-cart').should('be.visible');

      auditPage('product-detail');
    });
  });

  it('the cart meets WCAG 2.1 AA on serious and critical rules', () => {
    productService.firstPurchasable().then((product) => {
      productDetailPage.visitById(product.id).addToCart();
      header.goToCart();
      cartPage.el('proceed-1').should('be.visible');

      auditPage('cart');
    });
  });

  it('the sign-in form meets WCAG 2.1 AA on serious and critical rules', () => {
    loginPage.visit();
    loginPage.el('login-form').should('be.visible');

    auditPage('sign-in');
  });

  it('the registration form meets WCAG 2.1 AA on serious and critical rules', () => {
    registerPage.visit();
    registerPage.el('register-form').should('be.visible');

    auditPage('registration');
  });

  it('surfaces validation errors to assistive technology', () => {
    // A screen reader user who submits an empty form has to be told *which*
    // field is wrong. An error that is only red is not an error to them.
    loginPage.visit().submitEmpty();

    loginPage.el('email').should('have.attr', 'aria-invalid', 'true');
    loginPage.el('email').should('have.attr', 'aria-describedby', 'email-error');
    cy.get('#email-error').should('be.visible').and('not.have.text', '');
  });
});
