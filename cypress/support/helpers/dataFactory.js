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
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: 'New Zealand',
    postalCode: faker.location.zipCode('####'),
    phone: faker.string.numeric(10),
    ...overrides
  };
};

const newAddress = (overrides = {}) => ({
  street: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  country: 'New Zealand',
  postalCode: faker.location.zipCode('####'),
  ...overrides
});

const newCreditCard = (overrides = {}) => ({
  number: '4111111111111111',
  expiry: '12/2030',
  cvv: '123',
  holder: faker.person.fullName(),
  ...overrides
});

const newBankDetails = (overrides = {}) => ({
  bankName: faker.company.name(),
  accountName: faker.person.fullName(),
  accountNumber: faker.string.numeric(8),
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

module.exports = { newUser, newAddress, newCreditCard, newBankDetails, newContactMessage, PASSWORD };
