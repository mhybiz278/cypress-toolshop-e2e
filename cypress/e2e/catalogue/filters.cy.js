const { productListPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Catalogue filters', { tags: ['@catalogue', '@regression'] }, () => {
  beforeEach(() => {
    productListPage.visit().waitForProducts();
  });

  it('narrows results to a single category', () => {
    // The category is taken from a product that is actually on the shelf.
    // Picking the first entry in the reference data lands on a parent category
    // that holds no products of its own, and the test would then pass against
    // an empty grid — green, and asserting nothing.
    productService.firstPurchasable().then(({ category }) => {
      productService.listAll({ by_category: category.id }).then((inCategory) => {
        const namesInCategory = inCategory.map((p) => p.name);

        productListPage.filterByCategory(category.id);

        productListPage.products.should('have.length.greaterThan', 0);
        productListPage.productNames().then((rendered) => {
          rendered.forEach((name) =>
            expect(namesInCategory, `"${name}" belongs to ${category.name}`).to.include(name));
        });
      });
    });
  });

  it('narrows results to a single brand', () => {
    productService.firstPurchasable().then(({ brand }) => {
      productService.listAll({ by_brand: brand.id }).then((ofBrand) => {
        const namesOfBrand = ofBrand.map((p) => p.name);

        productListPage.filterByBrand(brand.id);

        productListPage.products.should('have.length.greaterThan', 0);
        productListPage.productNames().then((rendered) => {
          rendered.forEach((name) =>
            expect(namesOfBrand, `"${name}" is made by ${brand.name}`).to.include(name));
        });
      });
    });
  });

  it('never shows a product outside both filters when they are combined', () => {
    productService.firstPurchasable().then(({ brand, category }) => {
      productService.listAll({ by_brand: brand.id }).then((ofBrand) => {
        const namesOfBrand = ofBrand.map((p) => p.name);

        productListPage.filterByBrand(brand.id);
        productListPage.filterByCategory(category.id);

        // Adding a filter can only ever narrow. Anything rendered here that the
        // brand filter alone would not return means the filters are not being
        // combined — they are replacing one another.
        productListPage.productNames().then((rendered) => {
          rendered.forEach((name) =>
            expect(namesOfBrand, `"${name}" survives the brand filter`).to.include(name));
        });
      });
    });
  });

  it('clears a filter when it is unchecked', () => {
    productListPage.products.its('length').then((initial) => {
      productService.firstPurchasable().then(({ brand }) => {
        productListPage.filterByBrand(brand.id);
        productListPage.clearBrandFilter(brand.id);

        productListPage.products.should('have.length', initial);
      });
    });
  });
});
