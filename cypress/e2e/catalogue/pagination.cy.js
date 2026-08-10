const { productListPage } = require('../../support/pages');

describe('Catalogue pagination', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => productListPage.visit().waitForResults());

  it('loads a different set of products on page two', () => {
    productListPage.productNames().then((firstPage) => {
      productListPage.nextPage();

      productListPage.productNames().should((secondPage) => {
        expect(secondPage).to.have.length.greaterThan(0);
        expect(secondPage).to.not.deep.equal(firstPage);
      });
    });
  });

  it('returns to the original set when paging back', () => {
    productListPage.productNames().then((firstPage) => {
      productListPage.nextPage();
      productListPage.previousPage();

      productListPage.productNames().should('deep.equal', firstPage);
    });
  });

  it('never renders the same product on consecutive pages', () => {
    // Off-by-one errors in offset/limit typically surface as a duplicated
    // boundary record rather than an obvious failure.
    productListPage.productNames().then((firstPage) => {
      productListPage.nextPage();
      productListPage.productNames().should((secondPage) => {
        const overlap = secondPage.filter((n) => firstPage.includes(n));
        expect(overlap, `products duplicated across pages: ${overlap}`).to.be.empty;
      });
    });
  });
});
