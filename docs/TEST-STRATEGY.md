# Test Strategy — Toolshop

The document I'd write in the first fortnight on a team, before writing tests.

## 1. Objective

Give the team fast, trustworthy feedback on whether a customer can find a product, buy it, and manage their account — and catch regressions in those journeys before a release, not after.

"Trustworthy" is the operative word. A suite people don't believe gets re-run until it's green, and at that point it is worse than no suite at all.

## 2. Scope

**In scope:** customer-facing web journeys — catalogue, search and filtering, cart, checkout across all payment methods, authentication, account management — plus contract-level checks on the public API.

**Out of scope, and why:**

| Excluded | Reason |
|---|---|
| Admin back-office | Lower change frequency, smaller blast radius, few users |
| Payment provider internals | Third-party responsibility; we assert our request and their response |
| Email delivery | Needs a mail-trap service; would be the first thing I'd add |
| Load and stress | Different tooling and a different question |

## 3. Risk-based prioritisation

Coverage follows money and blast radius, not code structure.

| Journey | Impact if broken | Likelihood of breaking | Priority | Coverage |
|---|---|---|---|---|
| Checkout & payment | Revenue stops | Medium — many integrations | **P0** | Automated, in the smoke gate |
| Add to cart | Revenue stops | Medium | **P0** | Automated, smoke |
| Sign in | Existing customers locked out | Low | **P0** | Automated, smoke |
| Product listing & search | Nothing is findable | Medium | **P1** | Automated, regression |
| Registration | No new customers | Low | **P1** | Automated, regression |
| Account & invoices | Support load, not lost sales | Low | **P2** | Automated, regression |
| Contact form | Minor | Low | **P2** | Automated, regression |
| Comparison, rentals | Cosmetic | Low | **P3** | Exploratory only |

P0 journeys are the `@smoke` tag and gate every merge. Everything else runs nightly.

## 4. What gets automated — and what doesn't

Automate when a check is **repeatable, objective, and will run many times**: regression paths, boundary conditions, cross-browser basics, contract shapes.

Leave to a human when the question is **subjective or one-off**: does the checkout *feel* trustworthy, is the error copy actually helpful, does the layout hold up on a real phone, is this new feature's design sensible. Exploratory testing finds the defects that nobody thought to write an assertion for; automation defends the ones we already know about.

Automating the wrong things is expensive twice — once to write, forever to maintain.

## 5. Test levels

This suite is deliberately the thin top of the pyramid.

- **Unit / component** — the development team's, close to the code, milliseconds.
- **API / contract** *(here)* — schema, status codes, referential integrity. Seconds, no browser. Catches whole classes of defect before any UI test runs.
- **End-to-end UI** *(here)* — full journeys through a real browser. Slow and comparatively brittle, so reserved for journeys that genuinely span the stack.

If a case can be proven at a lower level, it belongs at the lower level. E2E specs that duplicate unit coverage are pure cost.

## 6. Test data

Generated, never shared. Each spec mints its own user via `dataFactory` and seeds state over the API.

This is not fastidiousness — shared accounts make suites order-dependent and impossible to parallelise safely. Unique email local parts mean five CI containers can run at once without colliding.

## 7. Environments

| Environment | Purpose | Trigger |
|---|---|---|
| Local (docker compose) | Development of tests | On demand |
| CI ephemeral | Pre-merge gate | Every PR |
| Staging | Full regression | Nightly |

Base URLs come from environment variables, so no code change is needed to retarget.

## 8. Entry and exit criteria

**Entry:** the build deploys, the API health check passes, and seed data is present.

**Exit:** all P0 specs pass; no open P1 defects on a P0 journey; any quarantined test has a ticket and an owner.

## 9. Flakiness policy

One retry in CI, zero locally. A spec that fails intermittently is treated as a defect in the test, not noise:

1. Reproduce with the recorded screenshot and the failing selector.
2. Fix the root cause — almost always a missing wait on a real application signal, or shared state between specs.
3. If it can't be fixed the same day, quarantine it with a ticket and an owner. Never silently raise the retry count.

Flake tolerance is how suites die: every unexplained re-run teaches the team that red means "try again".

## 10. Reporting

Mochawesome HTML per run, merged across parallel jobs, with embedded screenshots on failure. What matters to the team is the trend — pass rate over time and the flaky-test list — rather than any single run.

## 11. Defect reporting standard

Every defect raised from this suite carries: environment and build, exact reproduction steps, expected versus actual, severity with a stated rationale, and evidence. A sample is in [`docs/SAMPLE-BUG-REPORT.md`](SAMPLE-BUG-REPORT.md).
