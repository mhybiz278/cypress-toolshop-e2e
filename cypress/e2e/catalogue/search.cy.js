const { productListPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Catalogue search', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => productListPage.visit().waitForResults());

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

      productListPage.waitForResults().products.should('have.length', initialCount);
    });
  });

  it('is not case sensitive', () => {
    productService.firstPurchasable().then((product) => {
      const term = product.name.split(' ')[0];

      productListPage.search(term.toUpperCase());
      productListPage.productNames().then((upper) => {
        productListPage.visit().waitForResults().search(term.toLowerCase());
        productListPage.productNames().should('deep.equal', upper);
      });
    });
  });

  it('treats a whitespace-only term as no search', () => {
    productListPage.search('   ');

    productListPage.products.should('have.length.greaterThan', 0);
  });
});
