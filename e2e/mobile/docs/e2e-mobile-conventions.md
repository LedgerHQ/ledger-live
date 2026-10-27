# Mobile E2E conventions

Detox rules for `e2e/mobile`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Where files go and how to finish: [Add or update a mobile E2E test](e2e-mobile-add-or-update.md).

MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

The Contacts suite is the reference: [`specs/contacts`](../specs/contacts), [`contacts.page.ts`](../page/wallet/contacts.page.ts), [`contactDetail.page.ts`](../page/wallet/contactDetail.page.ts), [`contactName.drawer.ts`](../page/drawer/contactName.drawer.ts).

## Detox element creation and interactions MUST use an element handle or an installed global function

A page object migrated to [element handles](e2e-mobile-elements.md) MUST use them for every element. Elsewhere, creating, finding, tapping, typing, reading, waiting, and scrolling a Detox element MUST use an installed global. `jest.environment.ts` installs selected functions from `NativeElementHelpers` and `WebElementHelpers` in [`elementHelpers`](../helpers/elementHelpers.ts), and `types/global.d.ts` declares those functions. Examples are `getElementById`, `tapById`, `getTextOfElement`, `waitForElementById`, `getWebElementByTestId`, and `tapWebElementByTestId`. A direct import of either object MUST be used only by the element handles or where those globals are not available.

Code MUST NOT call `element(by...)`, `web.element(...)`, or the same operation on a raw Detox element. When no installed global performs the operation, that function MUST be added to `NativeElementHelpers` or `WebElementHelpers`, installed in `jest.environment.ts`, and declared in `types/global.d.ts`. `elementHelpers.ts` implements those globals and [`helpers/elements`](../helpers/elements) implements the handles, so they are the only places that call the Detox matchers.

## A shared Live App test id SHOULD match the desktop test id

When a Live App element already has a test id on desktop, the mobile selector SHOULD use that same id.

## Structure

### A spec MUST stay thin

A spec MUST declare only test metadata and invoke the sibling test function. The flow, feature-flag overrides, and the fixture MUST live in the test function file so a second scenario can reuse `initApp`.

### State MUST be arranged in fixtures and flags

See [E2E conventions](../../docs/e2e-conventions.md#setup-must-be-deterministic). Entry-point flags MUST belong in the test function file, combined with a preset from [`utils/featureFlagUtils`](../utils/featureFlagUtils.ts). `loadConfig` imports `data.settings`, `data.accounts`, `data.trustchain`, `data.postOnboarding`, and `data.payCard` when present. Other domain entities cannot be seeded this way.

### State MUST NOT be arranged in UI steps

A setup MUST NOT open screens or tap controls to reach the state under test.

### Tests MUST NOT use conditional steps

A step MUST NOT branch on a condition and run only when that condition is met. The branch costs time on every run and hides the regression when the expected path stops happening. The cause MUST be removed in the fixture or the flags.

A conditional step MAY stay when the test documents why the branch is required.

### The test function MUST decide which assertions run

The spec MUST decide the scope by calling only the relevant test functions. Expected UI strings MUST be passed in as parameters.

One fact per method MUST be the default, so a failing step names the broken claim. When the same checks on one component repeat across specs, a composite MAY be used. It MUST be named after the state it proves, and it MUST be built from the single-fact methods so the report still shows which one failed:

```ts
@Step("Expect the Me contact with no address")
async expectMeWithoutAddress(expectedLabel: string) {
  await this.expectMeContactDisplayed();
  await this.expectMeAddressCount(expectedLabel);
}
```

### A locator MUST belong to the page that renders it

The Contacts button drawn by My Wallet lives on `myWallet.page.ts`. A misplaced locator MUST be moved, and its usages updated, rather than duplicated.

### A navigation method MUST land on its destination

That keeps `expectScreenVisible` out of every other line of the spec without coupling callers to the destination's internals:

```ts
@Step("Open Contacts")
async openContacts() {
  await tapByElement(this.contactsButton());
  await app.contacts.expectScreenVisible();
}
```

An explicit arrival assertion MUST be called from the test function only when the spec's scope includes that arrival, such as after a back navigation or a mutation that re-renders the list.

### A fixed tap sequence MUST be one flow method

The method MUST live on the page that owns its parameter. `deleteContact(rowId)` sits on the list page because the row id is a list concept, and delegates to `detail.deleteContact()`.

### A reached screen MUST stay its own class

A screen reached from another screen MUST be its own class held as a property: `app.contacts.detail`, `app.contacts.detail.renameDrawer`. Drawers MUST stay drawers.

### Selector helpers MUST be private readonly class properties

Element getters and parameterized locator builders MUST be private readonly arrow-function class properties. Static IDs passed to waits MUST be private readonly strings. Dynamic IDs MUST use private readonly builder functions. A step MUST NOT build a matcher or ID inline.

```ts
private readonly contactsContent = () => getElementById("contacts-content");
private readonly savedContactRowName = (rowId: string) => getElementById(`${rowId}-name`);
private readonly addContactContentId = "contacts-add-contact-content";
```

In a page object migrated to element handles, a static locator MUST be a private readonly handle and a dynamic one a private readonly builder that returns a handle:

```ts
private readonly recipientInput = byId("recipient-input");
private readonly contactCompactRow = (contactId: string) => byId(`contacts-compact-row-${contactId}`);
```

### Every public method MUST use @Step

Parameters MUST be Handlebars placeholders: `{{0}}`, `{{1}}` by index, or named `@Step("Rename to {{name}}", ["name"])`. `$0` renders literally. Values are HTML-escaped, so use `{{{0}}}` for one containing `&`, `<`, or `'`. Arguments appear as Allure parameters even without a placeholder.

### The test function MUST call $TmsLink

The spec MUST pass the `B2CQA-XXXX` id and the test function MUST call `$TmsLink`. `$TmsLink`, `$Tag`, and `setTeamOwner` attach to the next `describe`, `it`, or hook defined after them, so placement decides which tests get them:

- Inside a `describe`, `$TmsLink` and `$Tag` MUST be called right before **each** `it`, after the hooks. A `beforeAll` in between takes them, and one call before several `it`s only reaches the first.
- `setTeamOwner` MUST be called before the `describe`, so every test in it gets the owner.

```ts
// spec
runBrowseAndSearchContactsTest(["B2CQA-6240"], tags);

// test function
setTeamOwner(Team.WALLET_XP);
describe("Contacts", () => {
  beforeAll(async () => { /* ... */ });

  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  it("browses contacts", async () => { /* ... */ });
});
```

## Stability

### A sheet wait MUST use that sheet's content anchor at 100% visibility

`toBeVisible()` defaults to 75%, which a bottom sheet satisfies while still sliding, so the next tap can hit a moving view. The wait MUST use an id that proves the sheet is fully presented. A `-content` anchor on its container SHOULD be used, because controls usually mount before presentation. An inset control MUST be used only when a documented platform-specific visibility issue makes the container unsuitable.

```ts
await tapByElement(this.actionsTrigger());
await waitForFullyVisibleById(this.actionsMenuContentId);
```

Measured on Contacts under a CPU-starved emulator: 2 failures in 4 at the default, 0 in 13 at 100%, costing about 4s per run.

### A failing wait MUST be fixed

[`scripts/flake-check.sh`](../scripts/flake-check.sh) reproduces the conditions that expose a too-tight wait. How to run it: [Before committing a test change](../README.md#before-committing-a-test-change). Tests MUST NOT add a retry to hide that wait.

### An entity id MUST be resolved before its label changes

A row id survives a rename. The name does not. Detox has no data API, so the id MUST be resolved once through a label matcher, then used for every later interaction.

### Navigation MUST go through the UI

A deeplink MUST NOT be used unless the deeplink is what is under test. A deeplink blurs the current screen and closes open bottom sheets.

### Timeouts MUST use a named bucket

A timeout, delay, or poll interval MUST be a `TIMEOUT` or `INTERVAL` bucket from [`utils/timeouts.ts`](../utils/timeouts.ts), not a bare number. A named constant in the file is allowed only when no bucket fits or the value needs its reason written down. Config files MAY keep literals, since the key already names them (`setupTimeout: 500000` in `detox.config.js`).

```ts
await waitForElementById(this.screenId, TIMEOUT.small); // not 5000
```

## Test data

### Generated values MUST come from live-e2e-shared and be valid by construction

Builders are shared with desktop specs. The shape MUST be derived from the product's validation rule, and that rule MUST be linked in JSDoc instead of restated. Use `randomUUID` where the product rejects duplicates.

### Fixtures MUST NOT rely on characters that iOS rewrites

iOS smart punctuation turns a typed `'` into `’`, so a straight apostrophe in a fixture fails on iOS only. Such characters MUST stay out of fixtures, and the test MUST say why.

## A tracked failure MUST use $KnownFailure

A test that fails because of a tracked bug MUST be flagged with `$KnownFailure`. It MUST NOT be skipped. It still runs once and still fails the run, but Detox does not retry it, so it costs one attempt whatever the retry setting.

```ts
import { $KnownFailure } from "@e2e/helpers/knownFailure";

// Whole spec: right before the test function call, like $TmsLink / $Tag.
$KnownFailure("LIVE-12345");
runSendTest(transaction, ["B2CQA-4225"], ["@NanoX", "@family-evm"]);

// One test: right before its it(), inside the describe.
$KnownFailure("LIVE-12345");
it("shows the network fee", async () => {
  /* ... */
});
```

- The argument MUST be the Jira key of the bug. It also becomes the test's Allure issue link.
- It MUST be placed immediately before the `describe`, `it`, or test function call. A hook (`beforeAll`, `beforeEach`, …) in between takes the flag instead, and the run log warns that it landed on a hook.
- `$KnownFailure` MUST be used only for a deterministic failure with a ticket. A flake MUST get a fixed wait (see [A failing wait MUST be fixed](#a-failing-wait-must-be-fixed)). A test that must not run at all MUST use a `.skip.spec.ts` suffix (or `describe.skip`), not a comment that disables the body.
- The flag MUST be removed in the fix. A flagged test that passes just reports green.

The run log lists what was left out of the retry under `[known-failure]`. Mechanism: [`jest.reporter.js`](../jest.reporter.js).

## Each asserted label MUST have its own testID

A testID MUST be preferred over text matching. Add:

- One id per label you assert, not just per row: `contacts-me-name`, `contacts-me-address-count`.
- The runtime id for per-entity rows: `contacts-saved-contact-${contactId}-name`. An id MUST NOT be able to match twice.
- A `testIDPrefix` prop on shared components, so each host namespaces its instance and existing callers keep their default.
- A content anchor per sheet, rendered only while it is open (see [A sheet wait MUST use that sheet's content anchor at 100% visibility](#a-sheet-wait-must-use-that-sheets-content-anchor-at-100-visibility)).

The identifier MUST be grepped across all test files before finishing. A shared component's testID is often asserted by desktop tests too.
