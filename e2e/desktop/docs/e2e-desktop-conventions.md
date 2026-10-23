# Desktop E2E conventions

Playwright rules for `e2e/desktop`. Shared rules: [E2E conventions](../../docs/e2e-conventions.md). Adding a coin or a spec: [Add or update a desktop E2E test](e2e-desktop-add-or-update.md).

MUST and MUST NOT are required. SHOULD is the default, and the same section states any exception.

## Synchronization

### Tests MUST NOT use page.waitForTimeout

Tests MUST wait for an element or a navigation instead.

## Specs

### Specs MUST NOT use Playwright test.step()

Specs MUST use the `@step` decorator on page-object methods (`tests/misc/reporters/step.ts`) so the step is reusable and reported the same way every time.

### Specs MUST NOT import page objects

Specs MUST call screens through the `app` fixture (`app.layout`, `app.send`, `app.speculos`).

### Specs MUST NOT contain assertions

Assertions MUST be named methods on the relevant page object.

### Fixture configuration MUST use test.use()

`userdata`, `teamOwner`, `speculosApp`, `featureFlags`, and `cliCommands` MUST be declared with `test.use()` at the describe level. They MUST NOT be inlined inside the test body.

## Page objects

### Every public page-object method MUST use @step

The decorator MUST be present so Allure reports the step.

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
