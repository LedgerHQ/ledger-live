# Desktop E2E conventions

Playwright rules for `e2e/desktop`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Adding a coin or a spec: [Add or update a desktop E2E test](e2e-desktop-add-or-update.md).

MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

## Synchronization

### Tests MUST NOT use page.waitForTimeout

Tests MUST wait for an element or a navigation instead.

### Pass a timeout as a `TIMEOUT` bucket

Most waits need no timeout: the page and `expect` defaults apply. When one does, pass a `TIMEOUT` bucket from [`@ledgerhq/live-e2e-shared/timeouts`](../../../libs/live-e2e-shared/src/timeouts.ts), not a bare number. Add a named constant in the file only when no bucket fits or the value needs its reason written down. The defaults follow the same rule: the page default in `tests/fixtures/common.ts` and the `expect` default in `playwright.config.ts` are buckets too. Only budgets no bucket covers, like the test timeout, stay literals in `playwright.config.ts`, since the key already names them.

```ts
await expect(this.walletSyncRow).toBeVisible({ timeout: TIMEOUT.xxlarge }); // not 60_000
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
