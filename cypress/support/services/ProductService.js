const api = require('./ApiClient');

class ProductService {
  list(params = {}) { return api.get('/products', { qs: params }); }
  getById(id) { return api.get(`/products/${id}`); }
  search(term) { return api.get('/products/search', { qs: { q: term } }); }
  brands() { return api.get('/brands'); }
  categories() { return api.get('/categories'); }

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
