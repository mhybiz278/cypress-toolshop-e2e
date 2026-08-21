const api = require('./ApiClient');
const productService = require('./ProductService');

/**
 * Carts and invoices over the API.
 *
 * Placing an order through the checkout wizard takes about eight seconds and
 * exercises five screens. A spec that is *about* invoices should not pay that
 * cost, or inherit a checkout failure as its own — it seeds the order over
 * HTTP and asserts through the UI.
 */
class OrderService {
  /** @returns {Cypress.Chainable<string>} the new cart's id */
  createCart() {
    return api.post('/carts', {}).then(({ status, body }) => {
      expect(status, 'create cart').to.be.oneOf([200, 201]);
      return body.id;
    });
  }

  addItem(cartId, productId, quantity = 1) {
    return api.post(`/carts/${cartId}`, { product_id: productId, quantity });
  }

  /**
   * The API re-runs the postcode lookup when an order is placed and rejects
   * any address whose city or state contradicts it, so a billing address is
   * built from the lookup rather than invented.
   *
   * @param {string} country ISO-3166 alpha-2 code, e.g. 'NZ'
   */
  billingAddressFor(country, postcode) {
    return api.get('/postcode-lookup', { qs: { country, postcode } }).then(({ status, body }) => {
      expect(status, 'postcode lookup').to.eq(200);
      return {
        billing_street: body.street,
        billing_city: body.city,
        billing_state: body.state,
        billing_country: country,
        billing_postal_code: postcode
      };
    });
  }

  invoices(params = {}) {
    return api.get('/invoices', { qs: params });
  }

  /**
   * Seed a completed order for the currently authenticated customer.
   *
   * @returns {Cypress.Chainable<object>} the created invoice
   */
  placeOrder({ country = 'NZ', postcode = '9930', paymentMethod = 'cash-on-delivery' } = {}) {
    return productService.firstPurchasable().then((product) =>
      this.createCart().then((cartId) =>
        this.addItem(cartId, product.id).then(() =>
          this.billingAddressFor(country, postcode).then((address) =>
            api.post('/invoices', {
              ...address,
              payment_method: paymentMethod,
              payment_details: {},
              cart_id: cartId
            }).then(({ status, body }) => {
              expect(status, `place order: ${JSON.stringify(body)}`).to.be.oneOf([200, 201]);
              return body;
            })
          )
        )
      )
    );
  }
}

module.exports = new OrderService();
