const { productListPage } = require('../../support/pages');

describe('Catalogue sorting', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => productListPage.visit().waitForResults());

  it('sorts by name A to Z', () => {
    productListPage.sortBy('name,asc');

    productListPage.productNames().should((names) => {
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).to.deep.equal(sorted);
    });
  });

  it('sorts by name Z to A', () => {
    productListPage.sortBy('name,desc');

    productListPage.productNames().should((names) => {
      const sorted = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).to.deep.equal(sorted);
    });
  });

  it('sorts by price ascending', () => {
    productListPage.sortBy('price,asc');

    productListPage.productPrices().should((prices) => {
      expect(prices).to.deep.equal([...prices].sort((a, b) => a - b));
    });
  });

  it('sorts by price descending', () => {
    productListPage.sortBy('price,desc');

    productListPage.productPrices().should((prices) => {
      expect(prices).to.deep.equal([...prices].sort((a, b) => b - a));
    });
  });
});
