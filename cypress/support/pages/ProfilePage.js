const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  constructor() { super('/account/profile'); }

  updateField(hook, value) { return this.fill(hook, value); }
  saveProfile() { return this.click('update-profile-submit'); }

  changePassword(currentPassword, newPassword) {
    this.fill('current-password', currentPassword);
    this.fill('new-password', newPassword);
    return this.click('change-password-submit');
  }

  shouldHaveValue(hook, value) {
    this.el(hook).should('have.value', value);
    return this;
  }
}

module.exports = new ProfilePage();
