# Defect log

Every entry below is a real, reproducible finding in the application under test,
raised by a spec in this repository against a locally seeded Toolshop instance
(`npm run app:up`, sprint 5 images, sample data).

None of these are fixed, because the application is not mine to fix. What is
mine is that the suite stays green *and* honest about them: each defect is
recorded in [`cypress/support/knownDefects.js`](../cypress/support/knownDefects.js)
(or, for accessibility, in
[`cypress/fixtures/a11y-baseline.json`](../cypress/fixtures/a11y-baseline.json))
and the corresponding test asserts the behaviour that was actually observed. The
guard is deliberately exact: **the day a defect is fixed, its test fails**, and
the entry has to be deleted and the assertion tightened. A known failure cannot
quietly rot into a permanently-skipped test.

| ID | Severity | Area | Summary |
|---|---|---|---|
| [TOOL-2104](#tool-2104) | **Critical** | Checkout | Confirming an order reports success but creates no order |
| [TOOL-2105](#tool-2105) | **Critical** (a11y) | Auth forms | Password visibility toggle has no accessible name |
| [TOOL-2106](#tool-2106) | Serious (a11y) | Catalogue, registration | Non-`<li>` children inside `<ul>` break list semantics |
| [TOOL-2101](#tool-2101) | Minor | Reference data | Category slug contains a space, so it is not URL-safe |
| [TOOL-2102](#tool-2102) | Minor | Catalogue | Whitespace-only search term is not trimmed |
| [TOOL-2107](#tool-2107) | Minor (testability) | Invoices | Three fields share one `data-test` value |

---

<a id="tool-2104"></a>

## TOOL-2104 — Confirming an order reports success but creates no order

**Severity:** Critical · **Priority:** Highest
**Component:** Checkout → payment step
**Environment:** Local stack, sprint 5 images, Chrome 141 / Electron 37, viewport 1440×900
**Found by:** `cypress/e2e/checkout/order-creation.cy.js`

### Summary

A customer completes checkout, presses **Confirm**, and is shown a green
"payment success" message. No order is created. `GET /invoices` returns nothing
for that customer, and nothing appears under *My invoices*. Pressing **Confirm**
a second time does create the order.

### Steps to reproduce

1. Sign in as any customer.
2. Add any in-stock product to the cart and proceed through the wizard.
3. On the payment step choose **Cash on delivery** (any method reproduces).
4. Press **Confirm**. A success message appears.
5. Go to **My account → Invoices**.

### Expected

An order exists and is listed under *My invoices*. If the order cannot be
created, the customer is told so.

### Actual

*My invoices* is empty. `GET /invoices` returns `total: 0`. No `POST /invoices`
request is made at all — the network tab shows only the payment check.

### Analysis

The confirm handler asks the payment service whether the payment is valid and
acts on the answer synchronously:

```ts
checkPayment(payload).subscribe(result => {
  if (result === true) { this.invoiceService.createInvoice(...) }
})
```

but `checkPayment` fires its request and returns `of(this.state)` immediately,
before that request has come back. On the first press `this.state` is
`undefined`, so `result === true` is false and the order is never submitted. The
success banner is painted a moment later by the response that did arrive — which
is why the customer is told the order went through. A second press finds
`this.state` already `true` and submits.

Two separate faults, and both matter:

1. The order is lost.
2. The success message reports the outcome of the *payment check*, not of order
   creation, so the UI is not capable of telling the truth here even once the
   race is fixed.

### Severity rationale

Critical. It is silent revenue loss on the primary conversion path, with
positive confirmation to the customer that their order was placed. There is no
error, nothing in the UI to retry, and a customer has no reason to check.

### Impact on this suite

Every checkout spec previously asserted "payment success message is visible" and
passed while creating nothing. The assertion has been renamed
`shouldShowPaymentAccepted()` and documented as covering the payment step only;
`checkout/order-creation.cy.js` is the one place that checks an order actually
exists, and `account/invoices.cy.js` seeds its orders over the API so it is not
blocked by this defect.

---

<a id="tool-2105"></a>

## TOOL-2105 — Password visibility toggle has no accessible name

**Severity:** Critical (accessibility) · **WCAG:** 4.1.2 Name, Role, Value (A)
**Component:** Shared `app-password-input`, used on sign-in and registration
**Found by:** `cypress/e2e/accessibility/wcag.cy.js` (axe rule `button-name`)

### Summary

The show/hide-password control is a `<button>` containing only an icon, with no
text, `aria-label` or `title`. A screen reader announces it as "button", with no
indication of what it does or what state it is in.

### Expected

An accessible name that reflects the action, and state exposed with
`aria-pressed` or by changing the name between "Show password" and "Hide
password".

### Actual

```html
<button class="btn btn-outline-secondary" (click)="togglePasswordVisibility()">
  <fa-icon [icon]="..."></fa-icon>
</button>
```

axe reports `button-name`, impact **critical**, one node on each of the sign-in
and registration forms.

### Severity rationale

Critical by axe's own scale and by consequence: it sits on the authentication
path, which nobody can route around, and the same component is reused for every
password field in the product — including the profile password change.

---

<a id="tool-2106"></a>

## TOOL-2106 — Non-`<li>` children inside `<ul>` break list semantics

**Severity:** Serious (accessibility) · **WCAG:** 1.3.1 Info and Relationships (A)
**Component:** Catalogue filters and navigation; registration form
**Found by:** `cypress/e2e/accessibility/wcag.cy.js` (axe rule `list`)

### Summary

Three `<ul>` elements on the catalogue and one on the registration form contain
children that are not `<li>`, `<script>` or `<template>`. Assistive technology
either drops the list semantics or announces the wrong item count, so a screen
reader user cannot tell how many filters or requirements there are, or navigate
between them as a list.

### Expected

Every direct child of a `<ul>` or `<ol>` is an `<li>`; wrappers go inside the
`<li>`, not around it.

### Severity rationale

Serious rather than critical: the content is still reachable, but list
navigation — a primary screen-reader movement — is broken on the page a customer
uses to find anything.

---

<a id="tool-2101"></a>

## TOOL-2101 — Category slug contains a space, so it is not URL-safe

**Severity:** Minor · **Component:** Reference data → `GET /categories`
**Found by:** `cypress/e2e/api/reference-data.api.cy.js`

### Summary

`GET /categories` returns the category *Storage Solutions* with the slug
`storage solutions`. A slug's entire purpose is to be safe in a URL; this one
has to be percent-encoded, and every other category's slug is correctly
hyphenated (`hand-tools`, `power-tools`).

### Expected

`storage-solutions`, matching the convention every other record follows.

### Severity rationale

Minor today because nothing currently routes on that slug. It is logged rather
than ignored because it is the kind of inconsistency that becomes a 404 the
moment somebody adds category landing pages — and because one record differing
from every other usually means a data-entry path with no validation behind it.

---

<a id="tool-2102"></a>

## TOOL-2102 — Whitespace-only search term is not trimmed

**Severity:** Minor · **Component:** Catalogue → search
**Found by:** `cypress/e2e/catalogue/search.cy.js`

### Summary

Searching for three spaces returns "there are no products found". The term is
passed through untrimmed and matched literally.

### Expected

The term is trimmed; an empty term leaves the catalogue as it was.

### Severity rationale

Minor. It is easy to hit by accident (a stray space, a paste) and the result —
an apparently empty shop — is more alarming than the mistake warrants.

---

<a id="tool-2107"></a>

## TOOL-2107 — Three fields share one `data-test` value

**Severity:** Minor (testability) · **Component:** Invoices → detail
**Found by:** `cypress/support/pages/InvoicesPage.js`

### Summary

On the invoice detail screen, *subtotal*, *additional discount* and *total* all
carry `data-test="total"`. The hook cannot identify any one of them, so a test
that wants the total has to fall back to the element id.

### Expected

One hook, one element: `data-test="subtotal"`, `data-test="discount"`,
`data-test="total"`.

### Why it is worth raising

This is the sort of thing that is trivial while the developer is in the file and
expensive later. Filed as a testability defect rather than worked around
silently: the fallback lives in one Page Object method, commented, so it is
visible rather than diffuse.

---

## Not a defect, but worth knowing

**Every rental product in the sample data is out of stock.** The API applies a
15% discount to a cart that mixes a product with a rental
(`CartService::updateDiscounts`), but that cart cannot be assembled through the
UI, because *Add to cart* is disabled for every rental. The discount path is
therefore untestable end-to-end against the shipped data — noted in the README's
known gaps rather than covered by a test that would only ever assert an empty
cart.
