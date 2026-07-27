# Soft assertions

## Introduction

[Playwright soft assertions](https://playwright.dev/docs/test-assertions#soft-assertions) (`expect.soft`) record a failure without stopping the test. The test continues, all soft failures are reported together at the end, and the run still fails if any soft check failed.

Use soft asserts for **non-blocking checks** (copy labels, supplementary UI state). Keep **hard** `expect(...)` for journey gates (navigation, clicks, amounts, device steps).

## Helper

[`tests/utils/softExpect.ts`](../tests/utils/softExpect.ts) — wraps a soft assertion and attaches a screenshot when it fails.

Page objects extending [`PageHolder`](../tests/page/abstractClasses.ts) can call `this.softExpect(assertion, options?)` with an optional `{ timeout }`.

## Why the helper

Soft assertions do not get a point-in-time screenshot. 
That is misleading when a soft check fails early and the test keeps going.

See this Playwright [thread](https://github.com/microsoft/playwright/issues/40819) for more information.

## Examples

### Page object (preferred)

```typescript
await this.softExpect(async soft => {
  await soft(this.themeRow).toContainText("My Theme");
});
```

Always **`await`** locator matchers inside the callback so the wrapper waits for the assertion to finish.

### Direct import

Two arguments: `softExpect(params, options?)`.

```typescript
import { softExpect } from "tests/utils/softExpect";

await softExpect(
  {
    page,
    assertion: async soft => {
      await soft(page.getByTestId("theme-row")).toContainText("My Theme");
    },
  },
);
```

### Override timeout

The soft expect timeout is short on purpose to avoid bloating overall test runtime.
To override the default, pass `{ timeout }` as the second argument:

```typescript
await this.softExpect(async soft => {
  await soft(this.chart).toContainText("My Chart");
}, { timeout: 10_000 });
```

```typescript
await softExpect(
  {
    page,
    assertion: async soft => {
      await soft(page.getByTestId("chart")).toContainText("My Chart");
    },
  },
  { timeout: 10_000 },
);
```

Use the injected **`soft`** matcher — not global `expect.soft` — so the configured timeout applies.

### Hard vs soft in one flow

```typescript
// In a page object method:

// hard — must be displayed to complete user journey
await expect(this.languageSelector).toBeDisabled();

// soft — does not block user journey
await this.softExpect(async soft => {
  await soft(this.generalTab).toContainText("General");
});
```
