# Architecture

## Dependency direction

```
        spec
          │  (imports)
          ▼
   Page Objects ──────► selectors.js
          │
          ▼
      services ───────► ApiClient ──► HTTP
          │
          ▼
       helpers
```

Dependencies point one way. A Page Object may use a helper; a helper never reaches back into a Page Object. Nothing below the spec layer imports a spec. This is what keeps the suite navigable at 25 specs and would keep it navigable at 250.

## Why a service layer, not just custom commands

Custom commands are global. Every command added is a name in a namespace shared by the entire suite, discoverable only by grep, with no natural grouping. At scale that becomes a flat list of eighty `cy.doSomething()` helpers where nobody can tell which are current.

Services are plain classes: importable, groupable, individually testable, and obvious at the call site — `productService.firstPurchasable()` says where to look. Commands are reserved for things that genuinely need Cypress's chaining or session machinery, which is why there are only four.

## Page Object conventions

- One class per screen. Components that appear across screens (the header) are their own class and are *composed*, not inherited.
- Exported as singletons — Page Objects are stateless drivers, so per-spec instances would be ceremony without benefit.
- Methods return `this` to allow chaining, except accessors that return a Cypress chainable.
- Methods are named for **intent** (`proceedToCheckout`), not mechanics (`clickProceedButton`).
- No business assertions. `shouldShowPaymentSuccess()` is a visibility check on a known element; whether the total was correct is asserted in the spec.

## Handling missing test hooks

The application does not expose a `data-test` attribute on every element — notably the cart's delete button and the invoice table rows. Rather than scatter structural selectors through the specs, each is isolated in a single Page Object method and commented as brittle. One place to fix when the markup shifts, and the technical debt is visible rather than diffuse.

On a real team this is also the moment to raise a ticket asking the developers to add the hook — cheaper for everyone than maintaining a CSS path.

## Waiting strategy

No fixed sleeps. The suite waits on:

1. **Application state signals** — the listing renders a container whose `data-test` value is its own state, so `waitForResults()` waits on `[data-test="loaded"]`.
2. **Network interception** — `cy.intercept` aliases registered in `support/e2e.js`.
3. **Cypress retry-ability** — assertions retry by default; `.should()` is the wait.

`cypress/no-unnecessary-waiting` is set to `error`, so a `cy.wait(2000)` fails lint rather than review.

## Parallelisation

CI splits by product area. Splitting by file count balances runtime slightly better, but splitting by area means a red job names the thing that broke. Suites are independent because no spec shares mutable data with another — which is a property of the data strategy, not of the CI config.
