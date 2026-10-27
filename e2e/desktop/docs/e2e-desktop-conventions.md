# Desktop E2E conventions

Playwright rules for `e2e/desktop`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Adding a coin or a spec: [Add or update a desktop E2E test](e2e-desktop-add-or-update.md).

MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

## Synchronization

### Tests MUST NOT use page.waitForTimeout

Tests MUST wait for an element or a navigation instead.

### A timeout or a poll interval MUST be a bucket

A wait SHOULD omit a timeout so the page and `expect` defaults apply. A passed timeout MUST be a `TIMEOUT` bucket from [`@ledgerhq/live-e2e-shared/timeouts`](../../../libs/live-e2e-shared/src/timeouts.ts), not a bare number. A poll interval or a pause between attempts (`expect.poll` `intervals`, a `setTimeout` in a polling loop) MUST be an `INTERVAL` bucket from the same file. A named constant in the file MUST NOT be added unless no bucket fits, such as a per-test budget (`test.setTimeout`) above the largest bucket, and it MUST state its reason. Feature-flag params such as `pollingInterval` or `searchDebounceTime` configure the app, not a wait, so this rule does not apply to them. The page default in `tests/fixtures/common.ts` and the `expect` default in `playwright.config.ts` MUST be buckets too. A budget no bucket covers, such as the test timeout, MAY stay a literal in `playwright.config.ts`, since the key already names it.

```ts
await expect(this.walletSyncRow).toBeVisible({ timeout: TIMEOUT.xxlarge }); // not 60_000
await expect.poll(countEnvs, { intervals: [INTERVAL.medium] }).toBeGreaterThan(0); // not [1_000]
```

## Specs

### Specs MUST NOT use Playwright test.step()

A spec MUST call a page-object method instead. The `@step` decorator on that method makes the step reusable and reported the same way every time.

### Specs MUST NOT import page objects

Specs MUST call screens through the `app` fixture (`app.layout`, `app.send`, `app.speculos`).

### Specs MUST NOT contain assertions

Assertions MUST be named methods on the relevant page object.

### Fixture configuration MUST use test.use()

`userdata`, `teamOwner`, `speculosApp`, `featureFlags`, and `cliCommands` MUST be declared with `test.use()` at the describe level. They MUST NOT be inlined inside the test body.

## Page objects

### Every public page-object method MUST use the @step decorator

The `@step` decorator (`tests/misc/reporters/step.ts`) MUST be present on the method so that Allure reports stay readable and name the same step every time.

### Page-object files and classes MUST match their base type

Files MUST be named `*.page.ts`, `*.modal.ts`, `*.drawer.ts`, or `*.dialog.ts`. Classes MUST be named `*Page`, `*Modal`, `*Drawer`, or `*Dialog`. Each class MUST extend the matching base class: `AppPage`, `WebViewAppPage`, `Modal`, `Drawer`, or `Dialog`.

### Locators MUST use getByTestId() when a test id exists

Otherwise a locator MUST use `getByRole()` or `getByText()` before an XPath or CSS selector.

## Windows

Electron exposes the main window and one or more webviews.

### Webviews MUST be resolved with getWebView()

A webview MUST be resolved with `getWebView()` and a `webviewIdentifier` title match. Tests MUST NOT use a fixed `electronApp.windows()[N]` index.

### A webview-only method MUST NOT take electronApp

Pass `electronApp` only when the method needs another window or an Electron event.

### Native modals MUST act on the main window

A native modal (for example delegation) MUST act on the main window. A Live App flow MUST act on its webview.

## Assertions

### Every test MUST include a TMS annotation

Every `test()` MUST include a TMS annotation with a valid `B2CQA-XXXX` id. The `annotationLinks` fixture publishes the Allure link before other fixtures run, so the link is present even when setup fails and the body never executes. Tests MUST NOT call `addTmsLink()` from a test body. A test with no annotation gets no link.

```typescript
const xrayTicket = "B2CQA-XXXX"; // obtain from QA before merging
test(
  "description",
  {
    tag: buildTags({ currencyId: account.currency.id }),
    annotation: { type: "TMS", description: xrayTicket },
  },
  async ({ app }) => {
    // ...
  },
);
```

### Journey gates MUST use hard assertions

Supplementary checks (copy, extra UI state) MAY use [soft assertions](soft-expect.md). Journey gates MUST stay hard `expect(...)` so they fail fast and stop the test when a critical condition is not met.

## Exclusive lock implementation

What a test declares: [Exclusive lock](../../docs/e2e-conventions.md#tests-must-declare-what-they-broadcast-from-or-change). Use `exclusiveLockFor` ([`tests/utils/exclusiveLock.ts`](../tests/utils/exclusiveLock.ts)), with its `names` on the `lock` detail and its `fixtures` in `test.use`:

```ts
const delegateLock = exclusiveLockFor({ broadcastAccounts: [delegate.account] });

test.describe("Delegate", { lock: delegateLock.names }, () => {
  test.use(delegateLock.fixtures);
```

Use both: `names` keeps this run's workers apart, and `fixtures` keeps other CI machines away. A test that no longer needs its lock part way through hands it back with the `exclusiveLock` fixture's `release()`, as `send.swap` does once its provider needs no token approval. The `lock` detail still holds until the test ends.
