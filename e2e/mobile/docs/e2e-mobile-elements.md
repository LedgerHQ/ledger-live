# Mobile E2E element handles

A page object declares each element once as a typed handle, then acts on it. Every action waits for the element first, so a forgotten wait cannot cause a flake.

Code: [`helpers/elements/native.ts`](../helpers/elements/native.ts), [`helpers/elements/web.ts`](../helpers/elements/web.ts). Reference page objects: [`newSendFlow.page.ts`](../page/trade/newSendFlow.page.ts) (native), [`earnV2Dashboard.page.ts`](../page/trade/earnV2Dashboard.page.ts) (webview and native).

## Declare

The factory names the match strategy. Declaring a handle does not touch the app, so it is safe for an element that is not on screen yet.

```ts
import { byId } from "@e2e/helpers/elements/native";

private readonly recipientInput = byId("recipient-input");
private readonly keyboardKey = (char: string) => byId(`keyboard-key-${char}`);
```

| Factory | Matches |
|---|---|
| `byId(id, index?)` | React Native `testID`; `index` picks the n-th match (default `0`) |
| `byText(text, index?)` | visible text, for an element with no `testID` (e.g. a navigation header title) |
| `byIdAndText({ id, text })` | `testID` and the element's own text |
| `byIdWithDescendantText({ id, text })` | `testID` and the text of a descendant, e.g. a button label |
| `byTextWithAncestorId({ id, text })` | a text inside the `testID` element, when the text has no `testID` of its own (e.g. a Lumen input helper text) |
| `webById(id)` | webview `data-testid` equal to `id` |
| `webByXPath(xpath)` | webview XPath, for an element without a usable `data-testid` |
| `webByCss(selector)` | webview CSS selector, for an element without a `data-testid` (e.g. `#app-container`) |

## Act

Native and web handles share these methods ([`ElementHandle`](../helpers/elements/elementHandle.ts)):

| Method | Does |
|---|---|
| `waitVisible()` | waits for the element; native `waitVisible(timeout, errorElement)` fails at once if the `errorElement` handle shows |
| `waitNotVisible()` | waits until the element is not visible (native) or no longer exists (webview) |
| `tap()` | waits, then taps |
| `replaceText(text)` | waits, then replaces the field content |
| `getText()` | waits, then returns the text |
| `isVisible(timeout?)` | returns a boolean for an element that may not appear, such as an optional button; a hung app still throws |
| `expectExist()` | asserts the element exists now; it does not wait |
| `expectNotExist()` | asserts the element does not exist now; it does not wait |
| `expectText(text, options?)` | asserts the element's text, see [Assertions](#assertions) |

Native handles also have `waitFullyVisible()` (bottom sheets, see [sheet waits](e2e-mobile-conventions.md#a-sheet-wait-must-use-that-sheets-content-anchor-at-100-visibility)), `waitExist()`, `waitNotExist()`, `clearText()`, `replaceTextKeepKeyboard()`, `getAttributes()`, `getIdentifier()`, `getLabel()`, `count()`, `expectCount()`, `expectEnabled()`, `scrollTo()`, `revealForTap()`, `tapExisting()`, `swipe()` and `isVisibleNow()`. Their JSDoc in [`native.ts`](../helpers/elements/native.ts) says what each does. The traps:

- `count()` and `expectCount()` do not wait: wait for the first match before.
- Before a tap, use `revealForTap()`, not `scrollTo()`: `scrollTo` stops at the edge where a sticky header or footer can still take the tap.
- For a closing sheet, use `waitNotExist()`: it can still block taps once it is no longer visible.
- `tapExisting()` skips the visibility wait. Use it only when `waitVisible` never passes for an element on screen, and say why at the call site.
- To pick the on-screen match among several, use `isVisibleNow()`: a short `isVisible` timeout skips a screen still settling.

Web handles also have `waitEnabled()`, `scrollTo()`, `scrollToAndTap()`, `waitTextMatching(pattern)`, `getValue()`, `expectValue()`, `expectValueMatching()`, `getIdentifier()` and `getChildTexts(cssSelector)`, documented in [`web.ts`](../helpers/elements/web.ts). The same file exports `waitForWebviewUrl(fragment)`, `waitForWebviewContent()` (the webview is not blank) and `removeWebviewStorageItems(keys)` (clears a Live App's saved state between tests).

## Default-wait contract

- Every element action waits up to `TIMEOUT.xxlarge`. `waitForWebviewUrl` defaults to `TIMEOUT.medium`.
- A native wait means at least 75% visible (`waitFullyVisible`: 100%). A webview has no visibility check, so a web wait means the element exists and its text can be read.
- Override the timeout with a bucket: `await this.signaturePrompt.waitVisible(TIMEOUT.xxxlarge)`.
- There is no opt-out: a page object cannot reach the Detox element behind a handle. When it needs an action the handle does not wrap, add that action as a handle method.

## Assertions

A wait is not an assertion. To check the current state, `expectVisible`, `expectNotVisible`, `expectExist`, `expectNotExist`, `expectId`, `expectToggleValue` (native) and `expectText` run a Detox `expect` on the element: synchronised with the app, they do not wait. Wait first when the element may still be appearing. `expectTextMatching` and `expectLabelMatching` wait for the element, read its text or accessibility label, then compare. A page object does not call `jestExpect` on a value it read from an element; `jestExpect` stays for plain values (counts, URLs, parsed amounts). To compare amounts computed from several elements within a tolerance (a sum of balances, a difference of quotes), use `expectWithinTolerance({ actual, expected, tolerance })` from [`amountUtils.ts`](../utils/amountUtils.ts).

Web `expectText` always waits for the element, reads its text, then compares. Native `expectText(text)` does not wait; with options (`ExpectTextOptions` in [`compareText.ts`](../helpers/elements/compareText.ts), like [expect-webdriverio](https://webdriver.io/docs/api/expect-webdriverio#string-options)) it waits for the element, reads its text, then compares. `expectAccessibilityValue`, `expectLabel` and `expectAmount` (native) always wait, read, then compare.

Add another matcher as a handle method with the first page object that needs it.

[`hardTimeout.ts`](../helpers/elements/hardTimeout.ts) bounds every Detox call a handle makes, `getAttributes()` and every web call included, so a hung bridge fails the step instead of the whole test.

