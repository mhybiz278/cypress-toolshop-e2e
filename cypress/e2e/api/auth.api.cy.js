const { api } = require('../../support/services');
const { newUser } = require('../../support/helpers/dataFactory');

describe('API — authentication', { tags: ['@api', '@regression'] }, () => {
  it('issues a token for valid credentials', () => {
    api.post('/users/login', {
      email: Cypress.env('seededCustomerEmail'),
      password: Cypress.env('seededCustomerPassword')
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.access_token || body.token, 'access token').to.be.a('string');
    });
  });

  it('rejects a wrong password with 401', () => {
    api.post('/users/login', {
      email: Cypress.env('seededCustomerEmail'),
      password: 'wrong-password'
    }).its('status').should('eq', 401);
  });

  it('does not leak whether the account exists', () => {
    api.post('/users/login', { email: newUser().email, password: 'whatever' })
      .then((unknown) => {
        api.post('/users/login', {
          email: Cypress.env('seededCustomerEmail'),
          password: 'wrong-password'
        }).then((known) => {
          expect(unknown.status, 'status parity').to.eq(known.status);
          expect(JSON.stringify(unknown.body)).to.eq(JSON.stringify(known.body));
        });
      });
  });

  it('refuses an unauthenticated request to a protected resource', () => {
    api.clearToken();
    api.get('/users/me').its('status').should('be.oneOf', [401, 403]);
  });

  it('refuses a malformed bearer token', () => {
    api.setToken('not.a.real.token');
    api.get('/users/me').its('status').should('be.oneOf', [401, 403]);
    api.clearToken();
  });

  it('validates the registration payload', () => {
    api.post('/users/register', { email: 'not-an-email' })
      .its('status').should('be.oneOf', [422, 400]);
  });
});
