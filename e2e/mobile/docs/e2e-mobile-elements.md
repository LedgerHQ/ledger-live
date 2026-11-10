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
| `webById(id)` | webview `data-testid` equal to `id` (the `*WebTestId` globals match a prefix, so migrate with the full id) |
| `webByXPath(xpath)` | webview XPath, for an element without a usable `data-testid` |

## Act

Native and web handles share these methods ([`ElementHandle`](../helpers/elements/elementHandle.ts)):

| Method | Does |
|---|---|
| `waitVisible()` | waits for the element; native `waitVisible(timeout, errorElement)` fails at once if the `errorElement` handle shows |
| `waitNotVisible()` | waits until the element is not visible (native) or no longer exists (webview) |
| `tap()` | waits, then taps |
| `replaceText(text)` | waits, then replaces the field content |
| `getText()` | waits, then returns the text |

Native handles also have `waitFullyVisible()` (bottom sheets, see [sheet waits](e2e-mobile-conventions.md#a-sheet-wait-must-use-that-sheets-content-anchor-at-100-visibility)), `clearText()`, `getAttributes()`, `getIdentifier()` (the `testID`, e.g. the full id behind a regex match), `getLabel()` (the accessibility label), `count()` (how many elements match, 0 when none; it does not wait, so wait for the first match before), `waitExist(timeout?, errorElement?)` (waits until the element is in the view hierarchy, for a list Detox does not measure as visible; `errorElement` fails as soon as that handle is visible), `waitNotExist()` (waits until the element leaves the view hierarchy; for a closing sheet that still blocks taps once hidden), `replaceTextKeepKeyboard()` (types without pressing Enter), `tapExisting()` (waits for the element to exist, not to be visible; only when `waitVisible` never passes for an element on screen, say why at the call site), `scrollTo(container?, pixels?)` (scrolls the container handle, or the first scroll view, until the element is visible; `pixels` sets the step, default 300), `revealForTap(container?)` (scrolls to the element and on past the viewport edge, so a sticky header or footer cannot take the next tap; use before a tap, keep `scrollTo` for assertions), `swipe(direction)` (waits, then swipes on the element, e.g. down on a bottom sheet) and `isVisible(timeout?)` (returns a boolean for an element that may not appear, such as an optional drawer; a hung app still throws).

Web handles also have `waitEnabled()` and `getValue()`. For the webview URL, use `waitForWebviewUrl(fragment)` from the same file, not the `*WebviewUrl*` globals.

## Default-wait contract

- Every element action waits up to `TIMEOUT.xxlarge`, the same default as `waitForElementById`. `waitForWebviewUrl` defaults to `TIMEOUT.medium`, like the global it replaces.
- A native wait means at least 75% visible (`waitFullyVisible`: 100%). A webview has no visibility check, so a web wait means the element exists and its text can be read.
- Override the timeout with a bucket: `await this.signaturePrompt.waitVisible(TIMEOUT.xxxlarge)`.
- There is no opt-out: a page object cannot reach the Detox element behind a handle. When it needs an action the handle does not wrap, add that action as a handle method.

## Assertions

A wait is not an assertion. To check the current state, `expectVisible`, `expectNotVisible`, `expectExist`, `expectNotExist`, `expectId`, `expectToggleValue` (native) and `expectText` run a Detox `expect` on the element: synchronised with the app, they do not wait. Wait first when the element may still be appearing. `expectTextContaining`, `expectTextMatching` and `expectLabelMatching` wait for the element, read its text or accessibility label, then compare. A page object does not call `jestExpect` on a value it read from an element; `jestExpect` stays for plain values (counts, URLs, parsed amounts).

Native `expectText(text, options)` takes string options, like [expect-webdriverio](https://webdriver.io/docs/api/expect-webdriverio#string-options): `normaliseWhitespace` (any whitespace, non-breaking spaces included, counts as one space; zero-width spaces and edges are dropped) and `containing` (contains instead of equals). With options it waits for the element, reads its text, then compares. `expectAccessibilityValue(text, options?)` (native) compares the accessibility value the same way: iOS `value`, Android `label`, e.g. a link that carries its URL there.

| Was | Now |
|---|---|
| `detoxExpect(getElementById(id)).toBeVisible()` | `handle.expectVisible()` |
| `detoxExpect(getElementById(id)).not.toBeVisible()` | `handle.expectNotVisible()` |
| `detoxExpect(getElementById(id)).toExist()` | `handle.expectExist()` (native) |
| `detoxExpect(getElementById(id)).not.toExist()` | `handle.expectNotExist()` (native) |
| `jestExpect(await getIdByRegexp(regex)).toBe(id)` | `handle.expectId(id)` (native) |
| `detoxExpect(getElementById(id)).toHaveText(text)` | `handle.expectText(text)` |
| `jestExpect(normalizeText(await getTextOfElement(id))).toEqual(normalizeText(text))` | `handle.expectText(text, { normaliseWhitespace: true })` (native) |
| `jestExpect(normalizeText(await getTextOfElement(id))).toContain(normalizeText(text))` | `handle.expectText(text, { normaliseWhitespace: true, containing: true })` (native) |
| `detoxExpect(getElementById(id)).toHaveToggleValue(value)` | `handle.expectToggleValue(value)` (native) |
| `jestExpect(await handle.getText()).toContain(text)` | `handle.expectTextContaining(text)` |
| `jestExpect(await handle.getText()).toMatch(regex)` | `handle.expectTextMatching(regex)` |
| `jestExpect(isIos() ? value : label).toContain(url)` after `getAttributesOfElement(id)` | `handle.expectAccessibilityValue(url, { containing: true })` (native) |
| `jestExpect(await getLabelOfElement(id)).toMatch(regex)` | `handle.expectLabelMatching(regex)` (a control whose value is its accessibility label, e.g. a Lumen `Tag`) |

Add another matcher as a handle method with the first page object that needs it.

The handles do not import `elementHelpers.ts`: [`hardTimeout.ts`](../helpers/elements/hardTimeout.ts) keeps the same hard timeout and failure text. Unlike the globals, every action waits for its element, and the hard timeout also bounds `getAttributes()` and every web call, so a hung bridge fails the step instead of the whole test.

## Migrate a page object

1. Replace each id string with a handle, and each dynamic id builder with a builder that returns a handle.
2. Merge each wait + act pair on the same element into one action.
3. Keep a wait on a different element (a screen anchor) as its own `waitVisible()` line.
4. Keep public method names and signatures, so specs do not change.

Before:

```ts
recipientCardSendId = "send-recipient-card-send";

async tapRecipientCardSend() {
  await waitForElementById(this.recipientCardSendId);
  await tapById(this.recipientCardSendId);
}
```

After:

```ts
private readonly recipientCardSend = byId("send-recipient-card-send");

async tapRecipientCardSend() {
  await this.recipientCardSend.tap();
}
```

## Status

The installed globals stay until every page object is migrated, then `elementHelpers.ts` is deleted. Which rule applies to which page object: [conventions](e2e-mobile-conventions.md#a-page-object-that-imports-element-handles-must-use-them-for-every-element).
