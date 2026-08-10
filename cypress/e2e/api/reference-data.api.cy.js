const { productService } = require('../../support/services');

describe('API — reference data', { tags: ['@api', '@regression'] }, () => {
  it('returns brands with id and name', () => {
    productService.brands().then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.be.an('array').and.not.be.empty;
      body.forEach((brand) => expect(brand).to.include.keys('id', 'name'));
    });
  });

  it('returns categories with a URL-safe slug', () => {
    productService.categories().then(({ status, body }) => {
      expect(status).to.eq(200);
      body.forEach((category) => {
        expect(category).to.include.keys('id', 'name', 'slug');
        expect(category.slug, `slug for ${category.name}`).to.match(/^[a-z0-9-]+$/);
      });
    });
  });

  it('has no duplicate brand names', () => {
    productService.brands().then(({ body }) => {
      const names = body.map((b) => b.name);
      expect(new Set(names).size, 'unique brand names').to.eq(names.length);
    });
  });

  it('references only categories that exist', () => {
    productService.categories().then(({ body: categories }) => {
      const ids = new Set(categories.map((c) => c.id));
      productService.list().then(({ body }) => {
        body.data.forEach((p) => {
          if (p.category) expect(ids.has(p.category.id), `category of ${p.name}`).to.be.true;
        });
      });
    });
  });
});
