require('cypress-axe');

/**
 * Audit the current page and compare against a recorded baseline.
 *
 * A first accessibility gate on an existing application always finds
 * violations. Failing the build on all of them means the gate gets disabled;
 * ignoring them means it never gets better. So each page carries a baseline of
 * `{ ruleId: count }`, and the assertion is exact:
 *
 *   - a rule that appears and is not in the baseline    -> fail (a regression)
 *   - a rule with more nodes than the baseline records  -> fail (it got worse)
 *   - a rule with fewer nodes, or gone entirely         -> fail, and the
 *     message says to lower the baseline, so a fix is locked in rather than
 *     leaving room to regress back to it silently
 *
 * @param {string} page          key in cypress/fixtures/a11y-baseline.json
 * @param {Record<string,number>} baseline recorded violations for that page
 */
Cypress.Commands.add('checkA11yAgainstBaseline', (page, baseline, axeOptions, checkOptions) => {
  cy.checkA11y(
    null,
    { ...axeOptions, ...checkOptions },
    (violations) => {
      const actual = {};
      violations.forEach((v) => { actual[v.id] = v.nodes.length; });

      const detail = violations
        .map((v) => `  ${v.id} (${v.impact}, ${v.nodes.length} node(s)) — ${v.help}`)
        .join('\n');

      expect(
        actual,
        `accessibility on "${page}" changed.\n${detail}\n\n`
          + 'A new rule or a higher count is a regression — fix it. A lower count '
          + 'means something was fixed: lower the number in '
          + 'cypress/fixtures/a11y-baseline.json so the improvement is locked in.'
      ).to.deep.equal(baseline);
    },
    true
  );
});
