const api = require('./ApiClient');

class FavouriteService {
  list() { return api.get('/favorites'); }
  add(productId) { return api.post('/favorites', { product_id: productId }); }
  remove(favouriteId) { return api.delete(`/favorites/${favouriteId}`); }

  /** Leave the account in a known state before a favourites spec runs. */
  clearAll() {
    return this.list().then((res) => {
      if (res.status !== 200 || !Array.isArray(res.body)) return;
      res.body.forEach((fav) => this.remove(fav.id));
    });
  }
}

module.exports = new FavouriteService();
