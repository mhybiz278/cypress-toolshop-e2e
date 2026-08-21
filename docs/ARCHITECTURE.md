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
- No business assertions. `shouldShowPaymentAccepted()` is a visibility check on a known element; whether the total was correct is asserted in the spec.
- Where an assertion has to retry — a badge that updates after a request, a total that settles after a refetch — the Page Object exposes a `should…` method built on `.should()`. A getter that returns a plain number cannot retry, and a spec that asserts on one is a race waiting to be blamed on flake.

## Handling missing test hooks

The application does not expose a `data-test` attribute on every element — notably the cart's delete button, the invoice table rows, and the guest-checkout tab. It also, on the invoice detail screen, puts the *same* hook on three different fields, which is worse than having none (TOOL-2107). Rather than scatter structural selectors through the specs, each fallback is isolated in a single Page Object method and commented as brittle. One place to fix when the markup shifts, and the debt is visible rather than diffuse.

On a real team this is also the moment to raise a ticket asking for the hook — cheaper for everyone than maintaining a CSS path. Both are in [the defect log](DEFECT-LOG.md).

## Waiting strategy

No fixed sleeps. The suite waits on:

1. **Application state signals.** The listing renders a container whose `data-test` value *is* its current state, so `waitForState('search_completed')` waits on something the application said about itself. Paging does not stamp that container, so paging waits on the request instead — the distinction is in `ProductListPage`, not guessed at per spec.
2. **The application's own requests.** Cart and account writes are aliased once in `support/e2e.js` and awaited inside the Page Object that triggers them, so "the item is in the cart" means the server said so rather than that 500 ms elapsed.
3. **Cypress retry-ability.** `.should()` is the wait; anything asserted on a value that has just changed goes through a retrying `should…` method rather than a one-shot read.

`cypress/no-unnecessary-waiting` is set to `error`, so a `cy.wait(2000)` fails lint rather than review.

## Known failures

A suite that is red for a reason nobody intends to fix teaches its team to ignore red. Two mechanisms keep confirmed application defects visible without leaving the build broken:

- `cypress/support/knownDefects.js` — `stillPresent(id, actual, expected)` asserts a defect is present *in exactly the shape it was logged in*. A second offender fails the build; so does a fix. Every id is written up in [the defect log](DEFECT-LOG.md).
- `cypress/fixtures/a11y-baseline.json` — the same contract for axe violations, per page, as `{ ruleId: nodeCount }`. New rules and higher counts fail; lower counts fail too, with a message saying to lower the baseline, so an improvement is locked in rather than leaving room to regress back to it silently.

Neither is `it.skip`. A skipped test asserts nothing and tells a reader nothing; these assert the current behaviour and expire the moment it changes.

## Why the application under test is pinned, and why Cypress 15

`docker-compose.yml` pins the application's published images so a checkout of this repo alone reproduces the suite. That pinning is not decoration: the catalogue endpoints are fetched with the HTTP `QUERY` method, and Cypress 14's proxy rejects it with a 400 before an intercept can even see the request. Every catalogue, cart and checkout spec fails with an empty grid, and none of the failures point anywhere near the cause — the application works perfectly in the same browser outside Cypress.

Cypress 15 handles `QUERY`. The upgrade is the fix, and it is the reason the suite can drive this application at all.

## Parallelisation

Specs are independent by construction — no spec shares mutable data with another, which is a property of the data strategy rather than of the CI config — so the suite can be split any way a runner likes: `--spec` by product area, tags via `--expose grepTags=@checkout`, or a matrix.

CI does not split it, and that is a deliberate trade. The application under test is about 6 GB of container images. Five matrix legs pull all of it five times, and each leg spends longer on `docker pull` than the entire suite takes to run. One runner boots the stack once and runs 116 tests in about five minutes. The moment the suite outgrows that, the split is a one-line matrix over `cypress/e2e/*` — the property that makes it safe is already there.
