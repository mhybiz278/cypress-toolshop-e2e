const { api } = require('../../support/services');
const { newUser } = require('../../support/helpers/dataFactory');

describe('API — authentication', { tags: ['@api', '@regression'] }, () => {
  /**
   * Each credential test mints its own account. Three bad passwords lock a
   * customer out, so pointing these at the shared sample account would leave it
   * locked for every suite that runs afterwards.
   */
  it('issues a token for valid credentials', () => {
    const user = newUser();
    cy.createUserByApi(user).then(() => {
      api.post('/users/login', { email: user.email, password: user.password })
        .then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.access_token || body.token, 'access token').to.be.a('string');
        });
    });
  });

  it('rejects a wrong password with 401', () => {
    const user = newUser();
    cy.createUserByApi(user).then(() => {
      api.post('/users/login', { email: user.email, password: 'wrong-password' })
        .its('status').should('eq', 401);
    });
  });

  it('does not leak whether the account exists', () => {
    const registered = newUser();
    cy.createUserByApi(registered).then(() => {
      api.post('/users/login', { email: newUser().email, password: 'whatever' })
        .then((unknown) => {
          api.post('/users/login', { email: registered.email, password: 'wrong-password' })
            .then((known) => {
              expect(unknown.status, 'status parity').to.eq(known.status);
              expect(JSON.stringify(unknown.body)).to.eq(JSON.stringify(known.body));
            });
        });
    });
  });

  it('locks an account after three failed attempts', () => {
    const user = newUser();
    cy.createUserByApi(user).then(() => {
      Cypress._.times(3, () => {
        api.post('/users/login', { email: user.email, password: 'wrong-password' })
          .its('status').should('eq', 401);
      });

      // 423 Locked, not 401: the account is no longer merely failing to
      // authenticate, and the correct credentials will not open it either.
      api.post('/users/login', { email: user.email, password: user.password })
        .then(({ status, body }) => {
          expect(status, 'locked account').to.eq(423);
          expect(JSON.stringify(body)).to.contain('locked');
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
