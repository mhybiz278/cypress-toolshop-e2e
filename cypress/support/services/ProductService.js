const api = require('./ApiClient');

class ProductService {
  list(params = {}) { return api.get('/products', { qs: params }); }
  getById(id) { return api.get(`/products/${id}`); }
  search(term) { return api.get('/products/search', { qs: { q: term } }); }
  brands() { return api.get('/brands'); }
  categories() { return api.get('/categories'); }

  /**
   * Walk the paginated envelope so a spec can assert against the whole result
   * set rather than whichever nine records happen to land on page one.
   *
   * @returns {Cypress.Chainable<object[]>} every product matching `params`
   */
  listAll(params = {}) {
    const collect = (page, acc) =>
      this.list({ ...params, page }).then(({ body }) => {
        const all = acc.concat(body.data);
        return page >= body.last_page ? all : collect(page + 1, all);
      });
    return collect(1, []);
  }

  /** First in-stock, non-rental product — a safe subject for cart tests. */
  firstPurchasable() {
    return this.list().then((res) => {
      const product = res.body.data.find((p) => p.in_stock && !p.is_rental);
      expect(product, 'a purchasable product exists in the catalogue').to.not.be.undefined;
      return product;
    });
  }
}

module.exports = new ProductService();
