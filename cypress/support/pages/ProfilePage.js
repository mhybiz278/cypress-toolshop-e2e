const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  constructor() { super('/account/profile'); }

  updateField(hook, value) { return this.fill(hook, value); }
  saveProfile() { return this.click('update-profile-submit'); }

  /**
   * The API validates `new_password` as `confirmed`, so the confirmation field
   * is not optional decoration — omitting it leaves the form invalid and the
   * password silently unchanged.
   */
  changePassword(currentPassword, newPassword) {
    this.fill('current-password', currentPassword);
    this.fill('new-password', newPassword);
    this.fill('new-password-confirm', newPassword);
    this.click('change-password-submit');
    cy.wait('@passwordChanged').its('response.statusCode').should('eq', 200);
    return this;
  }

  shouldHaveValue(hook, value) {
    this.el(hook).should('have.value', value);
    return this;
  }
}

module.exports = new ProfilePage();
