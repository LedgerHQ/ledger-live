# Adding or updating a mobile E2E test

How Detox specs and page objects are written in `e2e/mobile`, so a new test reads like the existing
ones and does not introduce flakiness. For machine setup and run commands see the
[README](../README.md) and `/e2e-mobile-onboard`.

The Contacts suite is the reference implementation: [`specs/contacts`](../specs/contacts),
[`contacts.page.ts`](../page/wallet/contacts.page.ts),
[`contactDetail.page.ts`](../page/wallet/contactDetail.page.ts),
[`contactName.drawer.ts`](../page/drawer/contactName.drawer.ts).

## Where files go

| What | Path |
| --- | --- |
| Spec — TMS links and tags only | `specs/<domain>/<scenario>.spec.ts` |
| Test function — the flow, flags, fixture | `specs/<domain>/<domain>.ts` |
| Screen page object | `page/<area>/<screen>.page.ts` |
| Drawer / bottom sheet | `page/<area>/<name>.drawer.ts` |
| App state fixture | `userdata/<name>.json` |
| Test data builder shared with desktop | `libs/live-e2e-shared/src/<domain>.ts` |

Register each page object in [`page/index.ts`](../page/index.ts) with `lazyInit` and a getter, so specs
reach it as `app.<name>`.

## Structure

1. **Keep the spec thin.** It holds only TMS links and tags; the flow, the `OptionalFeatureMap` and the
   fixture live in the sibling test function file so a second scenario can reuse `initApp`.

2. **Arrange state in fixtures and flags, not in UI steps.** Dismissed introductions, onboarding and
   settings belong in `userdata/*.json`; entry-point flags belong in the test function file, combined
   with a preset from [`utils/featureFlagUtils`](../utils/featureFlagUtils.ts). `loadConfig` imports
   `data.settings`, `data.accounts`, `data.trustchain`, and `data.postOnboarding` when present — other
   domain entities cannot be seeded this way.

3. **No conditional steps.** Never `completeXIfVisible`: it costs time on every run and hides the
   regression when the thing stops appearing. Remove the blocker via rule 2 instead.

4. **Assert in the spec, one fact per assertion.** Page objects expose `expect*` methods; the spec
   chooses which facts matter, so the test reads as a list of verified statements. Expected UI strings
   are spec constants (with the i18n key in a comment) passed in as parameters.

   One fact per method is the default, so a failing step names the broken claim instead of leaving you
   to read the diff. When the same checks on one component repeat across specs, a composite is fine —
   name it after the state it proves, and build it from the single-fact methods so the report still
   shows which one failed:

   ```ts
   @Step("Expect the Me contact with no address")
   async expectMeWithoutAddress(expectedLabel: string) {
     await this.expectMeContactDisplayed();
     await this.expectMeAddressCount(expectedLabel);
   }
   ```

5. **A locator belongs to the page that renders it.** The Contacts button drawn by My Wallet lives on
   `myWallet.page.ts`. Move a misplaced locator and update its usages rather than duplicating it.

6. **Navigation methods land the destination** — this is what keeps `expectScreenVisible` out of every
   other line of the spec without coupling callers to the destination's internals:

   ```ts
   @Step("Open Contacts")
   async openContacts() {
     await tapByElement(this.contactsButton());
     await app.contacts.expectScreenVisible();
   }
   ```

   Assert arrival from the spec only where arriving is the thing under test — after a back navigation,
   or after a mutation that re-renders the list.

7. **Wrap a fixed tap sequence into one flow method**, on the page owning its parameter:
   `deleteContact(rowId)` sits on the list page because the row id is a list concept, and delegates to
   `detail.deleteContact()`.

8. **Compose, don't merge.** A screen reached from another screen is its own class held as a property —
   `app.contacts.detail`, `app.contacts.detail.renameDrawer`. Drawers stay drawers.

9. **Element getters are arrow-function class properties**; ids passed to a wait rather than matched are
   plain strings. Never build a matcher inline in a step.

   ```ts
   contactsContent = () => getElementById("contacts-content");
   savedContactRowName = (rowId: string) => getElementById(`${rowId}-name`);
   addContactContentId = "contacts-add-contact-content";
   ```

10. **`@Step` on every public method.** Parameters are Handlebars placeholders — `{{0}}`, `{{1}}` by
    index, or named: `@Step("Rename to {{name}}", ["name"])`. `$0` renders literally. Values are
    HTML-escaped, so use `{{{0}}}` for one containing `&`, `<` or `'`. Arguments appear as Allure
    parameters even without a placeholder.

## Stability

11. **Wait for a sheet's own content anchor at 100% visibility.** `toBeVisible()` defaults to **75%**,
    which a bottom sheet satisfies while still sliding, so the next tap can hit a moving view. Wait on
    an id that exists only while that sheet is open — a `-content` anchor on its container, not a
    control inside it, since controls mount before presentation.

    ```ts
    await tapByElement(this.actionsTrigger());
    await waitForFullyVisibleById(this.actionsMenuContentId);
    ```

    Measured on Contacts under a CPU-starved emulator: 2 failures in 4 at the default, 0 in 13 at
    100%, costing ~4s per run.

12. **Fix the wait, don't add retries.** No polling loops, no `try/catch` re-taps, no "resilient step"
    helper. If a step needs retries, either the wait is wrong or there is a product bug to report.
    [`scripts/flake-check.sh`](../scripts/flake-check.sh) reproduces the conditions that expose a
    too-tight wait.

13. **Resolve an entity id before mutating what you match on.** A row id survives a rename; the name
    does not. Detox has no data API, so resolving the id once through a label matcher — then using it
    for every later interaction — is the intended pattern.

14. **Navigate through the UI, not deeplinks**, unless the deeplink is what's under test: it blurs the
    current screen and closes open bottom sheets.

## Test data

15. **Generate values in `live-e2e-shared`, valid by construction.** Builders are shared with desktop
    specs. Derive the shape from the product's validation rule and link that rule in JSDoc instead of
    restating it; use `randomUUID` where the product rejects duplicates.

16. **Mind cross-platform text rewriting.** iOS smart punctuation turns a typed `'` into `’`, so a
    straight apostrophe in a fixture fails on iOS only. Keep such characters out, and say why.

## Test IDs in product code

A testID is preferred over clever matching. Add:

- **One id per label you assert**, not just per row: `contacts-me-name`, `contacts-me-address-count`.
- **The runtime id for per-entity rows**: `contacts-saved-contact-${contactId}-name`. Never an id that
  can match twice.
- **A `testIDPrefix` prop on shared components**, so each host namespaces its instance and existing
  callers keep their default.
- **A content anchor per sheet**, rendered only while it is open (rule 11).

Grep the identifier across *all* test files before finishing — a shared component's testID is often
asserted by desktop integration tests too.

## Finishing

Follow [validate-before-finishing](../../../docs/validate-before-finishing.md), then:

- Run the spec you touched under degraded conditions, as described in
  [Before committing a test change](../README.md#before-committing-a-test-change).
- Run it on **both** platforms; visibility and text input differ.
- After a product-code testID change, confirm the bundle rebuilt — `createBundleDetoxJsAndAssets`
  reports UP-TO-DATE despite edits under pnpm-symlinked `features/`, so a missing testID looks like a
  code bug when it is a stale bundle.
- Dispatch filtered mobile CI (`/run-e2e-ci`) and read **Allure**, not just the green check: a retry
  hides a failed first attempt.

Comments follow `/comments` — keep only those recording a non-obvious reason.
