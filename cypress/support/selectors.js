/**
 * Single source of truth for test hooks.
 *
 * The application exposes `data-test` attributes. Keeping the attribute name
 * in one constant means that if the convention ever changes (data-testid,
 * data-qa...) it is a one-line fix rather than a find-and-replace across
 * ~25 specs.
 */
const ATTR = 'data-test';

const byTest = (value) => `[${ATTR}="${value}"]`;
const byTestStartsWith = (prefix) => `[${ATTR}^="${prefix}"]`;

module.exports = { ATTR, byTest, byTestStartsWith };
