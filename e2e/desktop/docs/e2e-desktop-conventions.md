# Desktop E2E conventions

Playwright rules for `e2e/desktop`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Adding a coin or a spec: [Add or update a desktop E2E test](e2e-desktop-add-or-update.md).

## Synchronization

### Do not use `page.waitForTimeout`

Wait for an element or a navigation instead.

### Pass a timeout as a `TIMEOUT` bucket

Most waits need no timeout: the page and `expect` defaults apply. When one does, pass a `TIMEOUT` bucket from [`@ledgerhq/live-e2e-shared/timeouts`](../../../libs/live-e2e-shared/src/timeouts.ts), not a bare number. Add a named constant in the file only when no bucket fits or the value needs its reason written down. `playwright.config.ts` can keep literals, since the key already names them.

```ts
await expect(this.walletSyncRow).toBeVisible({ timeout: TIMEOUT.xxlarge }); // not 60_000
```

## Specs

### Do not use Playwright's `test.step()` in a spec

Use the `@step` decorator on page-object methods (`tests/misc/reporters/step.ts`) so the step is reusable and reported the same way every time.

### Do not import screens (page objects) in a spec

Call screens through the `app` fixture (`app.layout`, `app.send`, `app.speculos`).

### Do not add assertions to spec files

No expect assertions in spec files — all assertions must be wrapped in named methods on the relevant page object instead.

### Fixture configuration uses `test.use()`

`userdata`, `teamOwner`, `speculosApp`, `featureFlags`, and `cliCommands` must be declared with test.use() at the describe level, not inlined inside the test body.

## Page Objects

### `@step` decorator on every public page object method

This is mandatory for Allure step visibility and reporting.

### POM classes follow naming and file conventions

Files: `*.page.ts`, `*.modal.ts`, `*.drawer.ts`, `*.dialog.ts`; classes: `*Page`, `*Modal`, `*Drawer`, `*Dialog`; extend the matching base class: `AppPage`, `WebViewAppPage`, `Modal`, `Drawer`, or `Dialog`.

### Prefer data-testid locators

Use `getByTestId()` as first choice; fall back to `getByRole()` or `getByText()` before resorting to XPath or CSS selectors.

## Windows

Electron exposes the main window and one or more webviews.

### Resolving webviews

Resolve a webview with `getWebView()` and a `webviewIdentifier` title match. Never use a fixed `electronApp.windows()[N]` index.

### A method that only touches the webview does not take `electronApp`

Pass it only when the method needs another window or an Electron event.

### Native modals and Live App flows

A native modal (for example delegation) acts on the main window. A Live App flow acts on its webview.

## Assertions

### TMS annotation

Every `test()` includes a TMS annotation with a valid `B2CQA-XXXX` id. The `annotationLinks` fixture publishes the Allure link before other fixtures run, so the link is present even when setup fails and the body never executes. Do not call `addTmsLink()` from a test body. A test with no annotation gets no link.

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

### Hard and soft assertions

Supplementary checks (copy, extra UI state) can use [soft assertions](soft-expect.md). Journey gates stay hard `expect(...)` so they fail fast and prevent further execution when a critical condition is not met.
