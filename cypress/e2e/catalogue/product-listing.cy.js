const { productListPage } = require('../../support/pages');
const { productService } = require('../../support/services');

describe('Product listing', { tags: ['@catalogue', '@smoke'] }, () => {
  beforeEach(() => {
    productListPage.visit().waitForProducts();
  });

  it('renders a page of products', () => {
    productListPage.products.should('have.length.greaterThan', 0);
    productListPage.el('product-name').first().should('not.have.text', '');
    productListPage.el('product-price').first().should('not.have.text', '');
  });

  it('shows the same first page the API returns', () => {
    // Guards against the UI silently dropping or reordering records — a class
    // of bug that pure UI assertions cannot see.
    productService.list({ page: 1 }).then((res) => {
      const expected = res.body.data.map((p) => p.name);
      productListPage.productNames().then((rendered) => {
        expect(rendered).to.deep.equal(expected.slice(0, rendered.length));
      });
    });
  });

  it('marks out-of-stock products', () => {
    productService.list().then((res) => {
      const outOfStock = res.body.data.find((p) => !p.in_stock);
      if (!outOfStock) {
        cy.log('No out-of-stock product on page 1 — nothing to assert');
        return;
      }
      productListPage.el(`product-${outOfStock.id}`).find('[data-test="out-of-stock"]').should('exist');
    });
  });

  it('opens a product from the grid', () => {
    productListPage.el('product-name').first().invoke('text').then((name) => {
      productListPage.openFirstProduct();
      cy.location('pathname').should('match', /^\/product\//);
      cy.getByTest('product-name').should('contain.text', name.trim());
    });
  });
});
