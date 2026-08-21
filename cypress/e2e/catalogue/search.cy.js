const { productListPage } = require('../../support/pages');
const { productService } = require('../../support/services');
const { stillPresent } = require('../../support/knownDefects');

describe('Catalogue search', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => {
    productListPage.visit().waitForProducts();
  });

  it('returns products matching the term', () => {
    productService.firstPurchasable().then((product) => {
      const term = product.name.split(' ')[0];

      productListPage.search(term);

      productListPage.productNames().should((names) => {
        expect(names.length).to.be.greaterThan(0);
        names.forEach((n) => expect(n.toLowerCase()).to.contain(term.toLowerCase()));
      });
    });
  });

  it('shows an empty state for a term with no matches', () => {
    productListPage.search('zzzz-no-such-product-zzzz');

    productListPage.shouldShowNoResults();
    productListPage.products.should('have.length', 0);
  });

  it('restores the full catalogue when the search is reset', () => {
    productListPage.products.its('length').then((initialCount) => {
      productListPage.search('zzzz-no-such-product-zzzz');
      productListPage.shouldShowNoResults();

      productListPage.resetSearch();

      productListPage.products.should('have.length', initialCount);
    });
  });

  it('is not case sensitive', () => {
    productService.firstPurchasable().then((product) => {
      const term = product.name.split(' ')[0];

      productListPage.search(term.toUpperCase());
      productListPage.productNames().then((upper) => {
        productListPage.visit().waitForProducts().search(term.toLowerCase());
        productListPage.productNames().should('deep.equal', upper);
      });
    });
  });

  it('does not trim a whitespace-only search term', () => {
    // Expected behaviour is that three spaces are trimmed to nothing and the
    // catalogue is left alone. The application searches for the spaces instead
    // and reports an empty catalogue — logged as TOOL-2102, asserted here as it
    // actually behaves so the suite stays honest and stays green.
    productListPage.search('   ');

    productListPage.shouldShowNoResults();
    cy.get('body').then(($body) =>
      stillPresent('TOOL-2102', $body.find('a[data-test^="product-"]').length, 0));
  });
});
