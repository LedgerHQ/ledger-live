# Mobile E2E conventions

Detox rules for `e2e/mobile`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Where files go and how to finish: [Add or update a mobile E2E test](e2e-mobile-add-or-update.md).

The Contacts suite is the reference: [`specs/contacts`](../specs/contacts), [`contacts.page.ts`](../page/wallet/contacts.page.ts), [`contactDetail.page.ts`](../page/wallet/contactDetail.page.ts), [`contactName.drawer.ts`](../page/drawer/contactName.drawer.ts).

## Webview and native

Webview operations use Detox web helpers. Native operations use regular Detox matchers. Mirror a desktop test id when the Live App shares it.

## Structure

### Keep the spec thin

It declares only test metadata and invokes the sibling test function. The flow, feature-flag overrides, and the fixture live in the test function file so a second scenario can reuse `initApp`.

### Arrange state in fixtures and flags, not in UI steps

See [E2E conventions](../../docs/e2e-conventions.md#state). Entry-point flags belong in the test function file, combined with a preset from [`utils/featureFlagUtils`](../utils/featureFlagUtils.ts). `loadConfig` imports `data.settings`, `data.accounts`, `data.trustchain`, `data.postOnboarding`, and `data.payCard` when present. Other domain entities cannot be seeded this way.

### No conditional steps

Never `completeXIfVisible`. It costs time on every run and hides the regression when the thing stops appearing. Remove the blocker in the fixture or the flags instead.

### Assert in the test function

The test function decides which assertions run. The spec decides the scope by calling only the relevant test functions. Expected UI strings are passed in as parameters.

One fact per method is the default, so a failing step names the broken claim. When the same checks on one component repeat across specs, a composite is fine. Name it after the state it proves, and build it from the single-fact methods so the report still shows which one failed:

```ts
@Step("Expect the Me contact with no address")
async expectMeWithoutAddress(expectedLabel: string) {
  await this.expectMeContactDisplayed();
  await this.expectMeAddressCount(expectedLabel);
}
```

### A locator belongs to the page that renders it

The Contacts button drawn by My Wallet lives on `myWallet.page.ts`. Move a misplaced locator and update its usages rather than duplicating it.

### Navigation methods land the destination

That keeps `expectScreenVisible` out of every other line of the spec without coupling callers to the destination's internals:

```ts
@Step("Open Contacts")
async openContacts() {
  await tapByElement(this.contactsButton());
  await app.contacts.expectScreenVisible();
}
```

Only call an explicit arrival assertion from the test function when the spec's scope includes that arrival, such as after a back navigation or a mutation that re-renders the list.

### Wrap a fixed tap sequence into one flow method

On the page that owns its parameter. `deleteContact(rowId)` sits on the list page because the row id is a list concept, and delegates to `detail.deleteContact()`.

### Compose, don't merge

A screen reached from another screen is its own class held as a property: `app.contacts.detail`, `app.contacts.detail.renameDrawer`. Drawers stay drawers.

### Selector helpers are private readonly arrow-function properties

Element getters and parameterized locator builders are private readonly arrow-function class properties. Static IDs passed to waits are private readonly strings; dynamic IDs use private readonly builder functions. Never build a matcher or ID inline in a step.

```ts
private readonly contactsContent = () => getElementById("contacts-content");
private readonly savedContactRowName = (rowId: string) => getElementById(`${rowId}-name`);
private readonly addContactContentId = "contacts-add-contact-content";
```

### `@Step` on every public method

Parameters are Handlebars placeholders: `{{0}}`, `{{1}}` by index, or named `@Step("Rename to {{name}}", ["name"])`. `$0` renders literally. Values are HTML-escaped, so use `{{{0}}}` for one containing `&`, `<`, or `'`. Arguments appear as Allure parameters even without a placeholder.

### `$TmsLink` attaches the id

The spec passes the `B2CQA-XXXX` id and the test function calls `$TmsLink`. `$TmsLink`, `$Tag` and `setTeamOwner` attach to the next `describe`, `it` or hook defined after them, so placement decides which tests get them:

- Inside a `describe`, call `$TmsLink` and `$Tag` right before **each** `it`, after the hooks. A `beforeAll` in between takes them, and one call before several `it`s only reaches the first.
- Call `setTeamOwner` before the `describe`, so every test in it gets the owner.

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

### Wait for a sheet's own content anchor at 100% visibility

`toBeVisible()` defaults to 75%, which a bottom sheet satisfies while still sliding, so the next tap can hit a moving view. Wait on an id that proves the sheet is fully presented. Prefer a `-content` anchor on its container because controls usually mount before presentation; use an inset control only when a documented platform-specific visibility issue makes the container unsuitable.

```ts
await tapByElement(this.actionsTrigger());
await waitForFullyVisibleById(this.actionsMenuContentId);
```

Measured on Contacts under a CPU-starved emulator: 2 failures in 4 at the default, 0 in 13 at 100%, costing about 4s per run.

### Fix the wait - do not add retries

[`scripts/flake-check.sh`](../scripts/flake-check.sh) reproduces the conditions that expose a too-tight wait. How to run it: [Before committing a test change](../README.md#before-committing-a-test-change).

### Resolve an entity id before mutating what you match on

A row id survives a rename. The name does not. Detox has no data API, so resolve the id once through a label matcher, then use it for every later interaction.

### Navigate through the UI, not deeplinks

Unless the deeplink is what is under test. A deeplink blurs the current screen and closes open bottom sheets.

### Avoid hardcoded durations

Pass a timeout, delay, or poll interval as a `TIMEOUT` or `INTERVAL` bucket from [`utils/timeouts.ts`](../utils/timeouts.ts), not a bare number. Add a named constant in the file only when no bucket fits or the value needs its reason written down. Config files can keep literals, since the key already names them (`setupTimeout: 500000` in `detox.config.js`).

```ts
await waitForElementById(this.screenId, TIMEOUT.small); // not 5000
```

## Test data

### Generate values in `live-e2e-shared`, valid by construction

Builders are shared with desktop specs. Derive the shape from the product's validation rule and link that rule in JSDoc instead of restating it; use `randomUUID` where the product rejects duplicates.

### Mind cross-platform text rewriting

iOS smart punctuation turns a typed `'` into `’`, so a straight apostrophe in a fixture fails on iOS only. Keep such characters out, and say why.

## Exclusive lock implementation

What a test declares: [Exclusive lock](../../docs/e2e-conventions.md#exclusive-lock). The test function calls `declareBroadcastAccounts`, `declareCliBroadcastAccounts` or `declareSharedResources` ([`helpers/exclusiveLock.ts`](../helpers/exclusiveLock.ts)) before its `describe`:

```ts
export function runDelegateTest(delegation: DelegateType /* … */) {
  declareBroadcastAccounts(delegation.account);
  describe("Delegate", () => {
```

The spec file holds the lock until its `describe` blocks have run. A file-level `afterAll` runs after the lock is released, so a cleanup that broadcasts goes inside a `describe`.

## Known failures and skips

A test that fails because of a tracked bug is flagged with `$KnownFailure`, not skipped. It still runs once and still fails the run, but Detox does not retry it, so it costs one attempt whatever the retry setting.

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

- Pass the Jira key of the bug. It also becomes the test's Allure issue link.
- Place it immediately before the `describe`, `it`, or test function call. A hook (`beforeAll`, `beforeEach`, …) in between takes the flag instead, and the run log warns that it landed on a hook.
- Only for a deterministic failure with a ticket. A flake gets a fixed wait (see [Fix the wait - do not add retries.](#fix-the-wait---do-not-add-retries)). A test that must not run at all uses a `.skip.spec.ts` suffix (or `describe.skip`), not a comment that disables the body.
- Remove the flag in the fix. A flagged test that passes just reports green.

The run log lists what was left out of the retry under `[known-failure]`. Mechanism: [`jest.reporter.js`](../jest.reporter.js).

## Test IDs in product code

A testID is preferred over clever matching. Add:

- One id per label you assert, not just per row: `contacts-me-name`, `contacts-me-address-count`.
- The runtime id for per-entity rows: `contacts-saved-contact-${contactId}-name`. Never an id that can match twice.
- A `testIDPrefix` prop on shared components, so each host namespaces its instance and existing callers keep their default.
- A content anchor per sheet, rendered only while it is open (see [Wait for a sheet's own content anchor at 100% visibility](#wait-for-a-sheets-own-content-anchor-at-100-visibility)).

Grep the identifier across all test files before finishing. A shared component's testID is often asserted by desktop tests too.
