const api = require('./ApiClient');

/**
 * Authentication over the API.
 *
 * UI tests that are not *about* logging in should never drive the login form —
 * it makes them slower and couples unrelated failures to the auth screen.
 * These helpers set up state; the auth specs still exercise the real UI.
 */
class AuthService {
  login(email, password) {
    return api.post('/users/login', { email, password }).then((res) => {
      expect(res.status, `login for ${email}`).to.eq(200);
      const token = res.body.access_token || res.body.token;
      api.setToken(token);
      return token;
    });
  }

  register(user) {
    return api.post('/users/register', {
      first_name: user.firstName,
      last_name: user.lastName,
      address: {
        street: user.street,
        house_number: user.houseNumber,
        city: user.city,
        state: user.state,
        country: user.country,
        postal_code: user.postalCode
      },
      phone: user.phone,
      dob: user.dateOfBirth,
      password: user.password,
      email: user.email
    });
  }

  me() { return api.get('/users/me'); }

  logout() { api.clearToken(); return cy.clearAllLocalStorage(); }
}

module.exports = new AuthService();
