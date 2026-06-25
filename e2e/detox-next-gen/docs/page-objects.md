---
name: detox-next-gen-page-objects
description: Read when adding or changing a page object in the detox-next-gen Detox POM (pages/).
---

# Page objects (`pages/`)

Layering: **specs → page objects → [elements lib](./elements.md) → Detox.**
App-specific knowledge (testIDs, selectors, deeplinks, the webview host) lives in page
objects; the elements lib stays generic.

## One class per screen

- `<name>.page.ts` for screens, `<name>.drawer.ts` for drawers / bottom-sheets.
- Native pages `extends CommonPage`; webview-hosted pages `extends LiveAppPage`.

## Locators are fields, actions are methods

Never build a locator inside an action. Declare it as a field, then act on it in the method.

```ts
private readonly searchInput = byId("modular-drawer-search-input");          // static handle
private readonly assetItem = (name: string): NativeHandle => byText(name).atIndex(0); // parameterized
async selectAsset(name: string) { await this.assetItem(name).tap(); }        // method just acts
```

Webview pages build handles off the inherited surface: `this.web.testId(...)` / `this.web.css(...)`.

## Bases

- **`CommonPage`** — only what is common to *every* screen (the shared `Continue` / `Confirm` CTAs). Keep it minimal.
- **`LiveAppPage extends CommonPage`** — base for pages inside the Wallet-API live-app webview. It owns the webview-host testID and a `protected web` surface, so subclasses only declare locators. The app-specific webview testID lives **here**, not in the lib.

## Aggregator

`pages/index.ts` exposes a single `app` with lazy-singleton getters. Specs `import { app }`
and call `app.<page>.<method>()`. Register new pages there.

## Add a page

1. `pages/<name>.page.ts` extending `CommonPage` (native) or `LiveAppPage` (webview).
2. Declare locator fields — static handles and parameterized builder fields.
3. Write action methods that call those locators.
4. Register the page in `pages/index.ts`.
