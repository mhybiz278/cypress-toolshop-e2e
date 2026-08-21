const { faker } = require('@faker-js/faker');

/**
 * Test data is generated, never hard-coded.
 *
 * Shared fixture accounts create order-dependent tests: one spec changes the
 * password and four others fail. Each spec that needs an account mints its own.
 *
 * @typedef {Object} NewUser
 */

const PASSWORD = 'Cypress#2026';

/** Strip anything the application's name patterns reject. */
const lettersOnly = (value) => value.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();

const newUser = (overrides = {}) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    // Unique local part keeps parallel CI jobs from colliding on the same email.
    email: `qa.${faker.string.alphanumeric(10).toLowerCase()}@example.test`,
    password: PASSWORD,
    dateOfBirth: faker.date.birthdate({ min: 25, max: 55, mode: 'age' }).toISOString().split('T')[0],
    street: faker.location.street(),
    houseNumber: faker.string.numeric({ length: { min: 1, max: 3 }, allowLeadingZeros: false }),
    city: faker.location.city(),
    state: faker.location.state(),
    country: 'New Zealand',
    postalCode: faker.location.zipCode('####'),
    phone: faker.string.numeric(10),
    ...overrides
  };
};

/**
 * A billing address is only a country, a postcode and a house number: the
 * application looks the rest up, and the API rejects an order whose city or
 * state disagrees with that lookup. Generating a city here would produce an
 * address no customer could ever submit.
 */
const newAddress = (overrides = {}) => ({
  country: 'New Zealand',
  postalCode: faker.string.numeric({ length: 4, allowLeadingZeros: false }),
  houseNumber: faker.string.numeric({ length: { min: 1, max: 3 }, allowLeadingZeros: false }),
  ...overrides
});

/**
 * The payment form validates each method's fields with its own pattern, so the
 * generated data has to match the shape the application actually accepts:
 * 4-4-4-4 with dashes, MM/YYYY, 3-4 digits, and a holder name of letters and
 * spaces only. Faker's `fullName` can return titles and full stops, which the
 * pattern rejects — hence the explicit first/last construction.
 */
const newCreditCard = (overrides = {}) => ({
  number: '4111-1111-1111-1111',
  expiry: '12/2030',
  cvv: '123',
  holder: lettersOnly(`${faker.person.firstName()} ${faker.person.lastName()}`),
  ...overrides
});

/** Bank name is letters and spaces only; the account number is digits only. */
const newBankDetails = (overrides = {}) => ({
  bankName: `${lettersOnly(faker.person.lastName())} Bank`,
  accountName: lettersOnly(`${faker.person.firstName()} ${faker.person.lastName()}`),
  accountNumber: faker.string.numeric(8),
  ...overrides
});

/** Gift cards are exactly 16 alphanumerics, with a 4-character code. */
const newGiftCard = (overrides = {}) => ({
  number: faker.string.alphanumeric({ length: 16, casing: 'upper' }),
  validationCode: faker.string.alphanumeric({ length: 4, casing: 'upper' }),
  ...overrides
});

const newContactMessage = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  subject: 'Customer service',
  // The form enforces a minimum length; 60 chars keeps us clear of the boundary.
  message: faker.lorem.sentences(3).slice(0, 250),
  ...overrides
});

module.exports = {
  newUser,
  newAddress,
  newCreditCard,
  newBankDetails,
  newGiftCard,
  newContactMessage,
  PASSWORD
};
