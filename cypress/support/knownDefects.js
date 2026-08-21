/**
 * Confirmed defects in the application under test that are not yet fixed.
 *
 * A failing assertion is only worth writing if somebody acts on it. Left red,
 * a known failure trains a team to ignore the build — so a confirmed defect is
 * recorded here, the spec asserts the behaviour that was actually observed, and
 * `stillPresent` fails the moment the application starts behaving correctly.
 * The entry then has to be deleted and the assertion tightened; it cannot quietly
 * rot into a permanently-skipped test.
 *
 * Every id below is written up in docs/DEFECT-LOG.md with steps and evidence.
 */
const KNOWN_DEFECTS = {
  'TOOL-2101': 'GET /categories returns a slug containing a space, so it is not URL-safe',
  'TOOL-2102': 'A whitespace-only search term is not trimmed, so the catalogue reports no results',
  'TOOL-2104': 'The first checkout confirmation reports success but never creates the order'
};

/**
 * Assert a logged defect is still present, in exactly the shape it was logged in.
 *
 * @param {keyof KNOWN_DEFECTS} id defect id
 * @param {*} actual   what the application does now
 * @param {*} expected what it did when the defect was raised
 */
function stillPresent(id, actual, expected) {
  const summary = KNOWN_DEFECTS[id];
  expect(summary, `${id} must be listed in cypress/support/knownDefects.js`).to.be.a('string');
  expect(
    actual,
    `${id} — ${summary}. If this failed because the application is now correct, `
      + 'delete the entry from knownDefects.js and tighten the assertion. Do not widen it.'
  ).to.deep.equal(expected);
}

module.exports = { KNOWN_DEFECTS, stillPresent };
