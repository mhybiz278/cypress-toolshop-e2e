# Toolshop E2E — Cypress Automation Framework

An end-to-end test framework for the open-source [Practice Software Testing "Toolshop"](https://github.com/testsmith-io/practice-software-testing) demo application — an Angular storefront with a documented REST API.

I built this to show how I structure a test suite, not just that I can write tests. The application under test is deliberately someone else's: everything here is the part I'd own on a real team — the architecture, the data strategy, the CI wiring, and the reasoning behind each.

**25 specs · 99 tests · 150+ assertions · Page Object Model + service layer · API-seeded state · parallel CI**

---

## Contents

- [Running it](#running-it)
- [How it's put together](#how-its-put-together)
- [Design decisions](#design-decisions)
- [What's covered](#whats-covered)
- [CI](#ci)
- [Known gaps](#known-gaps)

---

## Running it

The suite targets a locally running instance so that a CI failure means *the tests found something*, not *the public demo site was down*.

```bash
# 1. Start the application under test (from the Toolshop repo)
git clone https://github.com/testsmith-io/practice-software-testing
cd practice-software-testing && docker compose up -d --wait

# 2. Install and run this suite
npm ci
npm run cy:open          # interactive
npm test                 # headless, all suites
npm run test:api         # API contract specs only (~10s)
npm run test:smoke       # @smoke subset — the pre-merge gate
```

Point it at another environment without touching code:

```bash
CYPRESS_BASE_URL=https://staging.example.com \
CYPRESS_API_URL=https://api.staging.example.com \
npm test
```

Copy `cypress.env.example.json` to `cypress.env.json` for local credentials. That file is gitignored and must stay that way.

---

## How it's put together

```
cypress/
├── e2e/
│   ├── api/          Contract specs — fast, no browser
│   ├── auth/         Sign in, registration, session, recovery
│   ├── catalogue/    Listing, search, filters, sorting, pagination, detail
│   ├── cart/         Add, update, totals, empty states
│   ├── checkout/     Registered, guest, payment methods, validation
│   └── account/      Profile, favourites, invoices
└── support/
    ├── pages/        Page Objects — one per screen, plus HeaderComponent
    ├── services/     API layer — ApiClient, Auth, Product, Favourite
    ├── helpers/      dataFactory (Faker), money parsing
    ├── selectors.js  The data-test convention, in one place
    └── commands.js   Four custom commands, no more
```

Four layers, each with one job:

| Layer | Responsibility | Never does |
|---|---|---|
| **Spec** | States intent and asserts business outcomes | Touch a CSS selector |
| **Page Object** | Knows how to drive one screen | Assert business rules |
| **Service** | Sets up and tears down state over HTTP | Know about the DOM |
| **Helper** | Generates data, parses formats | Hold state |

A spec reads as the scenario, not as plumbing:

```js
it('completes an order end to end', () => {
  cartPage.proceedToCheckout();
  checkoutPage.proceedAfterSignIn();
  checkoutPage.fillAddress(newAddress()).proceedToPayment();
  checkoutPage.selectPaymentMethod('bank-transfer');
  checkoutPage.fillBankTransfer(newBankDetails());
  checkoutPage.confirmOrder();

  checkoutPage.shouldShowPaymentSuccess();
});
```

---

## Design decisions

**Set up state through the API, assert through the UI.**
A checkout test is about checkout. Driving the login form first makes it slower and couples it to an unrelated screen — so when auth breaks, twelve specs fail and none of them tell you why. `cy.loginByApi()` seeds the session over HTTP; the auth specs still exercise the real form, because that *is* what they're testing.

**Every spec mints its own data.**
Shared fixture accounts create order-dependent suites: one spec changes a password and four others fail on a later run. `dataFactory` generates a unique user per spec, which is also what makes the CI matrix safe to run in parallel.

**Retries are capped at one, deliberately.**
Retries hide flake, they don't fix it. A spec that needs more than one attempt gets investigated, not a higher retry count.

**No `cy.wait(ms)`, anywhere.**
The listing renders a state container whose `data-test` value *is* the current state, so `waitForResults()` waits on a real signal from the application. Arbitrary sleeps are banned by lint rule (`cypress/no-unnecessary-waiting`).

**One place for every selector.**
Test hooks are `data-test` attributes, and the attribute name lives in `selectors.js`. If the convention ever changes, it's a one-line edit rather than a find-and-replace across 25 files. Where the application has *no* hook — the cart's delete button, the invoice table — the structural selector is quarantined inside a single Page Object method and commented as such, so the brittleness is contained and visible.

**Assertions belong to specs, not Page Objects.**
Page Objects expose `shouldShowPaymentSuccess()` — a visibility check on a known element. Whether the *order total* was right is a business rule, and it's asserted in the spec where a reader can see it.

**API contract specs gate the UI matrix.**
They run in seconds without a browser. If the products endpoint changed shape, there's no point burning five containers to discover it as "element not found" three layers up.

**Custom commands are rationed.**
There are four. A command earns its place only if several specs use it and it hides genuine plumbing; anything screen-specific belongs in a Page Object. Otherwise `cy.` becomes a junk drawer.

---

## What's covered

| Area | Specs | Notable cases |
|---|---:|---|
| Authentication | 4 | Valid/invalid sign-in, **user-enumeration parity**, field validation, tampered-token rejection, protected-route redirect |
| Catalogue | 6 | UI-vs-API parity on page 1, search case-insensitivity, filter combination, sort order verified numerically, **no duplicate records across page boundaries** |
| Cart | 4 | Line merging on repeat add, quantity recalculation, zero-quantity rejection, persistence across reload |
| Checkout | 4 | Registered and guest flows, all 5 payment methods (data-driven), per-method field isolation, expired-card and incomplete-address rejection |
| Account | 3 | Profile round-trip, password change verified via API, favourites de-duplication, invoice generated by a real order |
| API contract | 3 | Pagination envelope, product schema, relation integrity, negative-price guard, auth status parity |

A few of these are the reason I'd write the suite at all:

- **User-enumeration parity** (`auth/login.cy.js`, `api/auth.api.cy.js`) — different error text for "unknown email" versus "wrong password" leaks which addresses hold accounts. The test asserts both paths read identically.
- **Page-boundary duplication** (`catalogue/pagination.cy.js`) — off-by-one errors in offset/limit show up as one record repeated across two pages, never as an obvious failure.
- **UI-vs-API parity** (`catalogue/product-listing.cy.js`) — catches the UI silently dropping or reordering records, which no pure-UI assertion can see.
- **Referential integrity** (`api/reference-data.api.cy.js`) — every product's category must actually exist.

---

## CI

Both [GitHub Actions](.github/workflows/e2e.yml) and [GitLab CI](.gitlab-ci.yml) are included and equivalent.

```
lint  →  api contract  →  e2e (5 parallel jobs)  →  merged report
```

Jobs are split **by product area**, not by arbitrary file count, so a red build names the area that broke before you open a report. Screenshots and Mochawesome JSON upload on failure; a final job merges them into one HTML report.

Nightly full regression runs at 05:00 NZST.

---

## Known gaps

Being straight about what this doesn't do:

- **No visual regression.** Worth adding for the product grid and checkout wizard; it needs a baseline strategy and a way to handle intentional design changes, which is a bigger conversation than a demo repo.
- **No accessibility assertions.** `cypress-axe` on the key user journeys is the obvious next increment.
- **No performance budget.** The listing endpoint would be the place to start.
- **Admin screens untouched.** Scoped out to keep the suite focused on the customer journey.
- **Mobile viewports untested.** The framework runs at a single desktop viewport; responsive coverage would mean a viewport matrix in CI.

---

## Why this exists

I work daily in a large production Cypress suite as an SDET. That code belongs to my employer, so this is the same thinking rebuilt from scratch on a public application — architecture, data strategy, CI, and the reasoning I'd bring to a code review.

**Mhyli Jade C. Bizares** — QA Engineer & SDET, Auckland NZ
[Portfolio](https://mhyli-bizares-qa.netlify.app/) · [LinkedIn](https://www.linkedin.com/in/mhyli-jade/)

MIT licensed. The application under test is the property of its authors.
