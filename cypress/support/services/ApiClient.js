/**
 * Thin wrapper over cy.request.
 *
 * Every service goes through here so that base URL, auth headers and the
 * "don't fail the test on a non-2xx, let the spec assert it" policy are
 * defined once. Specs asserting on status codes stay readable.
 */
class ApiClient {
  constructor() {
    this.token = null;
  }

  get baseUrl() { return Cypress.env('apiUrl'); }

  setToken(token) { this.token = token; return this; }
  clearToken() { this.token = null; return this; }

  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra
    };
  }

  request(method, path, { body, qs, headers, failOnStatusCode = false } = {}) {
    return cy.request({
      method,
      url: `${this.baseUrl}${path}`,
      body,
      qs,
      headers: this.headers(headers),
      failOnStatusCode
    });
  }

  get(path, options) { return this.request('GET', path, options); }
  post(path, body, options) { return this.request('POST', path, { body, ...options }); }
  put(path, body, options) { return this.request('PUT', path, { body, ...options }); }
  patch(path, body, options) { return this.request('PATCH', path, { body, ...options }); }
  delete(path, options) { return this.request('DELETE', path, options); }
}

module.exports = new ApiClient();
