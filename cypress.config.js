const { defineConfig } = require('cypress');

/**
 * Base URLs default to a locally running Toolshop stack (docker-compose).
 * Override per environment with CYPRESS_BASE_URL / CYPRESS_API_URL,
 * which is how the CI jobs target dev / staging without code changes.
 */
const BASE_URL = process.env.CYPRESS_BASE_URL || 'http://localhost:4200';
const API_URL = process.env.CYPRESS_API_URL || 'http://localhost:8091';

module.exports = defineConfig({
  projectId: 'toolshop-e2e',

  // Reporting -------------------------------------------------------------
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    charts: true,
    reportPageTitle: 'Toolshop E2E — Execution Report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    overwrite: true,
    html: true,
    json: true,
    // Keep the per-spec JSON after the HTML is built: CI turns it into the
    // run summary that appears on the workflow page.
    removeJsonsFolderAfterMerge: false
  },

  // Artefacts -------------------------------------------------------------
  video: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/artifacts/screenshots',
  videosFolder: 'cypress/artifacts/videos',
  downloadsFolder: 'cypress/artifacts/downloads',
  trashAssetsBeforeRuns: true,

  // Stability -------------------------------------------------------------
  // Retries in run-mode only. Deliberately low: retries hide flake, they
  // don't fix it. Anything needing >1 retry gets a ticket, not a bump.
  retries: { runMode: 1, openMode: 0 },
  defaultCommandTimeout: 8000,
  requestTimeout: 15000,
  responseTimeout: 20000,
  pageLoadTimeout: 45000,

  viewportWidth: 1440,
  viewportHeight: 900,
  watchForFileChanges: false,
  chromeWebSecurity: false,

  /**
   * `expose` rather than `env`: these are public configuration values, and
   * Cypress 15 deprecates `Cypress.env()` for them. There are no credentials
   * here on purpose — every spec mints its own account over the API, so the
   * suite ships with nothing to leak and nothing to keep in sync.
   */
  expose: {
    apiUrl: API_URL
  },

  e2e: {
    baseUrl: BASE_URL,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      require('@cypress/grep/plugin').plugin(config);

      on('task', {
        log: (message) => { console.log(message); return null; },
        table: (data) => { console.table(data); return null; }
      });

      // Allow --env overrides to win over defaults above.
      return config;
    }
  }
});
