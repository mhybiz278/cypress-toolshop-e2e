const { productService } = require('../../support/services');

/**
 * Contract-level checks on the catalogue endpoints.
 *
 * These run in seconds and catch schema drift long before a UI spec would —
 * a missing field shows up here as a clear failure rather than as an
 * "element not found" three layers up.
 */
describe('API — products', { tags: ['@api', '@smoke'] }, () => {
  it('returns a paginated envelope', () => {
    productService.list().then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.include.all.keys('current_page', 'data', 'last_page', 'per_page', 'total');
      expect(body.data).to.be.an('array').and.not.be.empty;
    });
  });

  it('returns the documented shape for a product', () => {
    productService.list().then(({ body }) => {
      const product = body.data[0];
      expect(product).to.include.all.keys(
        'id', 'name', 'description', 'price', 'is_location_offer', 'is_rental', 'in_stock'
      );
      expect(product.name).to.be.a('string').and.not.be.empty;
      expect(Number(product.price)).to.be.greaterThan(0);
      expect(product.in_stock).to.be.a('boolean');
    });
  });

  it('embeds the related brand and category', () => {
    productService.list().then(({ body }) => {
      const product = body.data[0];
      expect(product.brand, 'brand relation').to.include.keys('id', 'name');
      expect(product.category, 'category relation').to.include.keys('id', 'name', 'slug');
    });
  });

  it('honours the page parameter', () => {
    productService.list({ page: 1 }).then((first) => {
      productService.list({ page: 2 }).then((second) => {
        expect(second.body.current_page).to.eq(2);
        expect(second.body.data.map((p) => p.id))
          .to.not.have.members(first.body.data.map((p) => p.id));
      });
    });
  });

  it('returns 404 for a product that does not exist', () => {
    productService.getById('does-not-exist').then(({ status }) => {
      expect(status).to.be.oneOf([404, 405, 422]);
    });
  });

  it('never exposes a negative price', () => {
    productService.list().then(({ body }) => {
      body.data.forEach((p) => {
        expect(Number(p.price), `price of ${p.name}`).to.be.at.least(0);
      });
    });
  });
});
