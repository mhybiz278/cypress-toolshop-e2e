const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  constructor() { super('/account/profile'); }

  /**
   * The profile form renders empty and is populated asynchronously from
   * `GET /users/me`. Typing before that response lands is silently undone when
   * it arrives — the field reverts to the stored value and the form is left
   * invalid, so the submit handler never fires a request at all.
   *
   * On a local stack the response is fast enough that the race almost never
   * loses; against anything with real latency it loses most of the time. So the
   * page is not "ready" when the inputs exist, it is ready when they hold data.
   */
  visit(options = {}) {
    super.visit(options);
    return this.waitForLoaded();
  }

  waitForLoaded() {
    this.el('first-name', { timeout: 20000 }).should('not.have.value', '');
    this.el('last-name').should('not.have.value', '');
    this.el('email').should('not.have.value', '');
    return this;
  }

  updateField(hook, value) { return this.fill(hook, value); }

  /**
   * Wait on the write, not on the click. Reloading straight after the click
   * races the PUT, and the reload wins often enough to look like "the app
   * didn't save it".
   */
  saveProfile() {
    this.submitProfile();
    cy.wait('@profileUpdated').its('response.statusCode').should('be.oneOf', [200, 204]);
    return this;
  }

  /**
   * Submit without asserting the outcome. A negative case is *expecting* the
   * form to refuse, so it must not wait on a write that should never happen —
   * `saveProfile()` asserting a 200 is the right default, but it is the wrong
   * tool for proving a rejection.
   */
  submitProfile() {
    this.click('update-profile-submit');
    return this;
  }

  /**
   * Angular marks a control `ng-invalid`. Asserting on that rather than on the
   * banner's wording keeps the test working in all seven of the app's
   * languages.
   */
  shouldRejectField(hook) {
    this.el(hook).should('have.class', 'ng-invalid');
    return this;
  }

  /**
   * The API validates `new_password` as `confirmed`, so the confirmation field
   * is not optional decoration — omitting it leaves the form invalid and the
   * password silently unchanged.
   */
  changePassword(currentPassword, newPassword) {
    this.waitForLoaded();
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
