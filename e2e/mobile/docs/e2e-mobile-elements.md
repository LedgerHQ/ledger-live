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
| `byId(id)` | React Native `testID` |
| `webById(id)` | webview `data-testid` equal to `id` (the `*WebTestId` globals match a prefix, so migrate with the full id) |
| `webByXPath(xpath)` | webview XPath, for an element without a usable `data-testid` |

## Act

Native and web handles share these methods ([`ElementHandle`](../helpers/elements/elementHandle.ts)):

| Method | Does |
|---|---|
| `waitVisible()` | waits for the element |
| `waitGone()` | waits until the element is hidden (native) or no longer exists (webview) |
| `tap()` | waits, then taps |
| `replaceText(text)` | waits, then replaces the field content |
| `getText()` | waits, then returns the text |

Native handles also have `waitFullyVisible()` (bottom sheets, see [sheet waits](e2e-mobile-conventions.md#a-sheet-wait-must-use-that-sheets-content-anchor-at-100-visibility)), `clearText()`, `getAttributes()`, `replaceTextKeepKeyboard()` (types without pressing Enter) and `tapClipped()` (only for a control its parent clips on Android; say why at the call site).

Web handles also have `waitEnabled()` and `getValue()`. For the webview URL, use `waitForWebviewUrl(fragment)` from the same file, not the `*WebviewUrl*` globals.

## Default-wait contract

- Every element action waits up to `TIMEOUT.xxlarge`, the same default as `waitForElementById`. `waitForWebviewUrl` defaults to `TIMEOUT.medium`, like the global it replaces.
- A native wait means at least 75% visible (`waitFullyVisible`: 100%). A webview has no visibility check, so a web wait means the element exists and its text can be read.
- Override the timeout with a bucket: `await this.signaturePrompt.waitVisible(TIMEOUT.xxxlarge)`.
- There is no opt-out: a page object cannot reach the Detox element behind a handle. When it needs an action the handle does not wrap, add that action as a handle method.

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
