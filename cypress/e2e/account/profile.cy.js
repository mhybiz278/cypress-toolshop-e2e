const { profilePage } = require('../../support/pages');
const { newUser } = require('../../support/helpers/dataFactory');

describe('My profile', { tags: ['@account', '@regression'] }, () => {
  beforeEach(() => {
    // A dedicated account per spec: profile tests mutate data, and sharing the
    // seeded customer would leak changes into every other spec.
    const user = newUser();
    cy.createUserByApi(user).then((created) => {
      cy.wrap(created).as('user');
      cy.loginByApi(created.email, created.password);
      profilePage.visit();
    });
  });

  it('shows the details the account was created with', () => {
    cy.get('@user').then((user) => {
      profilePage.shouldHaveValue('email', user.email);
      profilePage.shouldHaveValue('first-name', user.firstName);
      profilePage.shouldHaveValue('last-name', user.lastName);
    });
  });

  it('saves an updated city and keeps it after a reload', () => {
    profilePage.updateField('city', 'Auckland').saveProfile();

    cy.reload();

    profilePage.shouldHaveValue('city', 'Auckland');
  });

  it('will not save an empty mandatory field', () => {
    profilePage.el('first-name').clear();
    profilePage.submitProfile();

    profilePage.shouldRejectField('first-name');

    cy.reload();
    profilePage.el('first-name').should('not.have.value', '');
  });

  it('changes the password and signs in with the new one', () => {
    cy.get('@user').then((user) => {
      const newPassword = 'Cypress#2026-Updated';

      profilePage.changePassword(user.password, newPassword);

      cy.clearAllLocalStorage();
      cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/users/login`,
        body: { email: user.email, password: newPassword },
        failOnStatusCode: false
      }).its('status').should('eq', 200);
    });
  });
});
