# Sample Defect Report

Illustrative — the format I use, written against a real finding from the pagination spec.

---

**ID:** TOOL-1042
**Title:** Product appears on both page 1 and page 2 of the catalogue when sorted by price
**Severity:** Major · **Priority:** High
**Component:** Catalogue → listing → pagination
**Environment:** Staging, build `2026.08.06-1147`, Chrome 141 / macOS 15.2, viewport 1440×900
**Reported by:** Mhyli Jade Bizares · 6 Aug 2026

## Summary

With the catalogue sorted by price ascending, the last product on page 1 is also rendered as the first product on page 2. The record is duplicated in the UI and one product is pushed off the end of the result set entirely — so a customer paging through the catalogue never sees it.

## Steps to reproduce

1. Go to `/` (product listing).
2. Set **Sort** to `Price, ascending`.
3. Note the name and price of the **last** product on page 1.
4. Click **Next**.
5. Compare against the **first** product on page 2.

## Expected

Each product appears exactly once across the paginated result set. Page 2 begins with the record immediately after the last on page 1.

## Actual

The final product on page 1 is repeated as the first on page 2. Comparing the full set against `GET /products?page=1` and `?page=2` shows the API returning an overlapping record at the boundary, and the total count is one higher than the number of distinct products returned.

## Evidence

- `cypress/artifacts/screenshots/pagination.cy.js/duplicate-boundary.png`
- Failing spec: `cypress/e2e/catalogue/pagination.cy.js` → *never renders the same product on consecutive pages*
- API responses attached: `page1.json`, `page2.json`

## Analysis

Consistent with an off-by-one in the offset calculation (`offset = page * perPage` rather than `(page - 1) * perPage`, or an inclusive upper bound). Only reproduces when a sort is applied, which points at the ordered query path rather than the default listing.

## Severity rationale

Major rather than Critical: no data loss, no revenue path blocked, and the customer can still reach the product via search. But it is a silent correctness failure — nothing errors, the page looks fine, and a customer would have no reason to suspect a product is missing from the catalogue.

## Regression risk

Any change to sorting, filtering, or page size touches the same query builder. Recommend the pagination spec runs in the pre-merge gate rather than nightly.
