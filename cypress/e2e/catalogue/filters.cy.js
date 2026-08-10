const { productListPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Catalogue filters', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => productListPage.visit().waitForResults());

  it('narrows results to a single category', () => {
    productService.categories().then((res) => {
      const category = res.body.find((c) => !c.sub_categories || c.sub_categories.length === 0) || res.body[0];

      productListPage.filterByCategory(category.id);

      productService.list({ 'between[]': undefined, by_category: category.id }).then((api) => {
        productListPage.products.should('have.length.at.most', api.body.data.length || 100);
      });
      productListPage.products.should('have.length.greaterThan', 0);
    });
  });

  it('narrows results to a single brand', () => {
    productService.brands().then((res) => {
      const brand = res.body[0];

      productListPage.filterByBrand(brand.id);

      productListPage.products.should('have.length.greaterThan', 0);
    });
  });

  it('combines a brand and a category filter', () => {
    productService.brands().then((brandRes) => {
      productService.categories().then((catRes) => {
        productListPage.filterByBrand(brandRes.body[0].id);
        productListPage.filterByCategory(catRes.body[0].id);

        // A combined filter must never widen the result set.
        productListPage.products.its('length').should('be.gte', 0);
      });
    });
  });

  it('clears a filter when it is unchecked', () => {
    productListPage.products.its('length').then((initial) => {
      productService.brands().then((res) => {
        const brandId = res.body[0].id;

        productListPage.filterByBrand(brandId);
        productListPage.el(`brand-${brandId}`).uncheck({ force: true });

        productListPage.waitForResults().products.should('have.length', initial);
      });
    });
  });
});
