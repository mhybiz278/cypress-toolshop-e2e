/** Parse '$1,234.50' -> 1234.5 */
const toNumber = (text) => Number(String(text).replace(/[^0-9.]/g, ''));

/** Compare currency to 2dp without tripping over float noise. */
const closeTo = (actual, expected, delta = 0.01) =>
  expect(actual, `expected ${actual} to be within ${delta} of ${expected}`).to.be.closeTo(expected, delta);

module.exports = { toNumber, closeTo };
