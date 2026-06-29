---
name: detox-next-gen-elements
description: Read when using or extending the element-interaction lib (helpers/elements) in the detox-next-gen Detox suite.
---

# Elements lib (`helpers/elements`)

Locate an element, then act on it. The lib hands back **action-ready handles**, and the
match strategy is **explicit at the locator** — a bare string is never assumed to be a testID.

## Locate — strategy-named factories

Native → `NativeHandle`:

- `byId("submit")` — testID (`by.id`)
- `byText("Continue")`, `byLabel("…")`, `byType("…")`
- `byMatcher(by.id(/row-.*/i))` — any raw Detox matcher (regex, compound)

Webview → build a surface scoped to one webview, then match within it:

- `const w = webView(by.id("my-webview"))`
- `w.testId("pay")` (React `data-testid`), `w.css("[data-testid^='row-']")`, `w.id(htmlId)`, `w.xpath("…")`

The webview's testID is **supplied by the caller** (a page object — see
[page-objects.md](./page-objects.md)), so the lib stays app-agnostic.

## Scope — compose locators (don't index)

Refine a locator by **structure** instead of position. Each returns a new handle (immutable), so they chain with `.atIndex` and every action method.

- `child.withAncestor(parent)` — `child` restricted to matches under `parent`. Chains: `c.withAncestor(b).withAncestor(a)`.
- `el.withDescendant(inner)` — the row/container that *contains* `inner`.
- `a.and(b)` — both matchers must hold on one element.

```ts
await byText("Send").withAncestor(byId("account-row-BTC")).tap();  // scope by structure
await byText("Send").atIndex(2).tap();                             // ✗ brittle: breaks on reorder
```

Prefer `withAncestor` over `atIndex(n)` into a list. **Caveat:** Detox scopes by re-matching the ancestor *pattern*, not a resolved element, so the ancestor locator must be **unique** — a non-unique ancestor (`byType`, a shared id) scopes to *every* match's descendants, and an `atIndex` on the ancestor is not carried in. Native only; inside a webview a CSS descendant selector already does this (`w.css(".row-BTC .send")`).

## Act — methods on the handle

`await byId("submit").tap()` — every native action waits for visibility first.

- Native: `tap / typeText / replaceText / clearText / waitVisible / waitExists / waitGone / getText / getAttributes / isVisible / exists`, plus the locator refiners `.atIndex(n)` / `.withAncestor` / `.withDescendant` / `.and` (see **Scope** above) and `.raw`.
- Web: `tap({ scroll? }) / click / type / wait({ visible? }) / exists / visible / scrollIntoView / getValue / raw`.

## Web gotchas (handled by the lib)

- **No `waitFor` for web** → `wait()` polls. **Existence ≠ visibility** → pass `{ visible: true }` when tappability matters.
- **testID ≠ id** → React renders testID as `data-testid`; use `w.testId(...)` (CSS), not `w.id(...)` (the HTML id).
- **`runScript` is the escape hatch** → `getValue()` reads `.value`; `click()` dispatches a DOM click when `.tap()` doesn't fire the React handler.

## Structure & rules

- `native/` (handle + factories) and `web/` (handle + surface); the **handle is the sole impl**.
- Add an action → a method on the handle. Add a matcher → a factory.
- Need something unwrapped (longPress, swipe)? Use `el(matcher)` / `handle.raw` for the raw Detox element.
- **Don't**: put app-specific testIDs/selectors here; reintroduce "string means testID"; add free functions that duplicate handle methods.
- Timeouts come from [timeouts.md](./timeouts.md).
