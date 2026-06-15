# Detox and Maestro - Comparison

Comparison page for **Detox** and **Maestro** (POC `feat/qaa-1242-poc-maestro`, `e2e/maestro/`).

> The Maestro POC is **not** raw `.yaml` flows. It is a small TypeScript layer: Page Objects buffer
> Maestro commands into a `FlowBuilder`, the spec serializes them to one `.yaml` and runs a single
> `maestro test`. It reuses the **same WebSocket bridge + Speculos** infrastructure as the Detox suite.

## Webview

Webviews are used to render the live apps, eg swap.

#### Detox

Detox fetches the [webelement](https://wix.github.io/Detox/docs/api/webviews) and operates on the **DOM**
via `by.web.*` matchers + `runScript`. This is independent of the OS accessibility tree, so it works the
same across iOS versions.

```typescript
// e2e/mobile — DOM-level, by data-testid
const input = web.element(by.web.id("from-account-amount-input"));
await input.typeText("99");
await expect(input).toHaveValue("99");
```

#### Maestro

Maestro has **no context concept** — native and webview live in one hierarchy. It matches webview
elements by their **visible label** (`text:`), not by `data-testid`. The live app does not expose
testIds as `id`, so taps/asserts are done by text inside the single flow:

```typescript
// pages/swapLiveApp.ts — webview matched by VISIBLE TEXT
tapGetQuotes() {
  this.flow.addStep("swap-get-quotes", [{ tapOn: { text: "View quotes" } }]);
}
waitForQuotes() {
  this.flow.addStep("swap-wait-quotes", [
    { extendedWaitUntil: { visible: { text: "[0-9]+ quotes? found" } } },
  ]);
}
```

How Maestro _reads_ the webview is platform-dependent:

- **iOS ≤ 18.x** — WKWebView projects content into the accessibility tree → `text:` matches directly.
- **iOS 26** — **unsupported.** Apple stopped exposing WebView content to that tree
  ([Maestro #2891](https://github.com/mobile-dev-inc/Maestro/issues/2891)); `text:` no longer reaches
  the swap webview and there is **no fallback**.
- **Android** — content is not in the native tree, so the runtime adds
  `androidWebViewHierarchy: devtools` and Maestro reads the DOM via Chrome DevTools.

> **Observation:** `text:` cannot reliably _type_ into a webview `<input>`. The POC still drives text
> entry through an injected-JS bridge (the 329-line `webviewDriverScripts.ts`), not Maestro:
>
> ```typescript
> async inputAmount(amount: string) {
>   await this.driveWebView({ op: "waitForTestId", testId: "from-account-amount-input" });
>   await this.driveWebView({ op: "typeText", testId: "from-account-amount-input", value: amount });
> }
> ```

## Hooks

Hooks manage setup, teardown and state during the testing lifecycle.

#### Detox

Detox has no runner; the [recommended](https://wix.github.io/Detox/docs/introduction/project-setup) one is
**Jest** — `globalSetup`/`globalTeardown` + suite/test hooks.

#### Maestro

Maestro has **no test runner and no hooks** at all. The POC builds the lifecycle by hand: every spec is a
plain `async` function wrapped in `withMaestroSession`, which owns install → Speculos → bridge → launch →
feature flags → body → teardown.

```typescript
export async function runAddAccountSpec(ctx: MaestroContext) {
  await withMaestroSession(
    ctx,
    {
      userdata: "skip-onboarding",
      mainSpeculos: { name: "Bitcoin", testName: "maestro-add-account" },
    },
    async () => {
      await ctx.app.openDeepLink("ledgerlive://portfolio");
      await ctx.portfolio.openAddAccount();
      ctx.modularDrawer.selectAssetForAddAccount("BTC");
      await ctx.runFlow("add-account");
    },
  );
}
```

No `describe`/`it`, no assertion library — a spec passes unless something `throw`s.

## Locators

A strong locator strategy is essential for readable code and stable execution.

#### Detox

Detox uses [matchers](https://wix.github.io/Detox/docs/api/matchers/) for native (`by.id()`, `by.label`)
and [web matchers](https://wix.github.io/Detox/docs/api/webviews) for webview (`by.web.id`,
`by.web.cssSelector`). React testIDs resolve consistently on both platforms.

#### Maestro

Maestro selectors are plain objects: `{ id }`, `{ text }`, `{ index }`, plus relative selectors
(`below`, `above`, `containsChild`) and `point`. A React Native `testID` resolves on **both** platforms
with no abstraction layer, and **conditionals are native to the flow** (no JS needed):

```typescript
// pages/modularDrawer.ts
selectAsset(account: Account): void {
  this.app.addStep(`mad-select-${account.currency.ticker}`, [
    { tapOn: { id: this.searchInputId } },
    { inputText: account.currency.ticker },
    { tapOn: { id: this.assetItemId(account.currency.ticker), index: 0, retryTapIfNoChange: true } },
    { runFlow: {                                   // only if the network step appears
        when: { visible: { id: this.networkItemId(network) } },
        commands: [{ tapOn: { id: this.networkItemId(network), index: 0, retryTapIfNoChange: true } }],
    }},
    { tapOn: { id: this.accountItemId, index: 0, retryTapIfNoChange: true } },
  ]);
}
```

Native locators are simpler than Detox and require **no context switching**. The trade-off is the webview
(text-only, see above).

## Allure Reporting

#### Detox

Uses `detox-allure2-adapter` + `jest-allure2-reporter`, with a `@Step` annotation for page-object steps.
Screenshots auto-attach; rich, but needs Jest wiring.

#### Maestro

No Jest, so the POC drives `allure-js-commons` (`ReporterRuntime`) **directly** (`runtime/allure.ts`):
one Allure test per spec, each native flow recorded as a step, the generated `.yaml` attached, and
screenshots from `~/.maestro/tests/` attached after every flow.

```typescript
await allureStep(`native flow: ${name}`, async () => {
  allureAttach(`${name}.yaml`, contents, "text/yaml");
  // ...run maestro...
});
```

Functional, but step granularity is coarser (one step per _flow_, not per command) and there is no
built-in video/JUnit yet.

## Javascript Execution

JS execution should be avoided where possible to keep results realistic.

#### Detox

[`runScript`](https://wix.github.io/Detox/docs/api/webviews/#runscriptscript-args) executes JS **in the
real webview engine** against the live DOM.

#### Maestro

Maestro's `evalScript`/`runScript` run in **GraalJS** — only the built-in `http`/`output`/`json` are
available; **you cannot `require` npm or `@ledgerhq/live-common`**. The POC uses `evalScript` only for a
flow-local output flag:

```typescript
{
  evalScript: "${output.swapProviderPicked = 'changelly'}";
}
```

Any JS that must touch the **webview DOM** (eg setting the amount input) goes through the RN-side bridge
(`webviewDriverScripts.ts`), not Maestro. So DOM scripting is split across two mechanisms.

## Waits and timeouts

#### Detox

Detox [syncs with app state](https://wix.github.io/Detox/docs/articles/how-detox-works/) by default
(can be disabled) and offers explicit `waitFor(...).withTimeout(...)`. Reliable, but the sync can hang on
a never-idle app (websockets/BLE).

#### Maestro

Maestro has **no app-state synchronization**. It polls the view hierarchy and retries. The POC sets
sensible defaults and leans on Maestro's retry primitives:

```typescript
const DEFAULT_TAP_SETTLE_TIMEOUT_MS = 100; // waitToSettleTimeoutMs on every tapOn
const DEFAULT_WAIT_TIMEOUT_MS = 60_000; // default extendedWaitUntil timeout
// + retryTapIfNoChange on taps; the JS webview bridge does its own 100ms poll loop
```

Because there is no idle-detection to hang on, native flows can be **more** robust on our app — but you
own every wait, and the Speculos-signing concurrency (`Promise.allSettled([runFlow, acceptOnDevice])`)
becomes timing-sensitive.

## App launch

LW requires custom launch arguments (eg the WebSocket port).

#### Detox

`device.launchApp({ launchArgs, permissions, languageAndLocale, detoxURLBlacklistRegex })`, called from a
Jest hook. Rich native device control.

#### Maestro

Install is done **outside** Maestro (`xcrun simctl install` / `adb install`, in `pages/app.ts`); Maestro
only launches with arguments. Deeplinks are sent over the **bridge**, not via Maestro `openLink` (so the
OS URL dispatch path is not exercised):

```typescript
async launch(launchArgs) {
  await this.maestro.runFlow("launch-app", [
    { launchApp: { appId: this.project.appId, arguments: launchArgs } },
  ]);
}
async openDeepLink(url) { await this.bridge.openDeeplink(url); } // bridge, not OS
```

Maestro exposes fewer native device controls than Detox; the custom bridge fills the gap.

## Summary

| Area             | Detox                                                       | Maestro                                                                                          | Takeaway                                                                                        |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Webview**      | `web.element(by.web.*)` DOM matchers — iOS-version safe     | `text:` on the OS hierarchy (iOS ≤ 18 only; **broken on iOS 26**) + injected-JS bridge for input | Detox robust on modern iOS; Maestro **regresses** there                                         |
| **Hooks**        | Jest `globalSetup`/`teardown` + hooks                       | None — custom `withMaestroSession` in TS                                                         | Maestro: you own the whole lifecycle                                                            |
| **Locators**     | `by.id` / `by.web.*`                                        | `{ id }` / `{ text }`, cross-platform, `when:` built-in                                          | Maestro simplest for native, **no context switch**                                              |
| **Allure**       | `detox-allure2-adapter` + `jest-allure2-reporter` + `@Step` | `allure-js-commons` directly, 1 test/spec, flow-level steps                                      | Both work; Maestro coarser, no video/JUnit yet                                                  |
| **JS execution** | `runScript` in the real webview DOM                         | `evalScript` in GraalJS (no npm) + RN bridge for DOM                                             | Detox reaches the DOM cleanly; Maestro splits it                                                |
| **Waits**        | App-state sync by default                                   | No sync; `extendedWaitUntil` + retry + bridge poll                                               | Detox reliable by default; Maestro can be _less_ flaky on our never-idle app, but you own waits |
| **App launch**   | `device.launchApp()` (args, permissions, blacklist)         | `launchApp { arguments }`; install via `xcrun`/`adb`; deeplink via bridge                        | Detox richer device control                                                                     |

**Webview note:** Detox drives the swap webview by DOM `data-testid`; Maestro reads it from the OS
accessibility tree (`text:`) — which Apple removed on iOS 26. Routing all webview ops through the
injected-JS bridge would restore iOS coverage but reduces Maestro to a native shell + launcher.

**Verdict:** Maestro wins on authoring simplicity, cross-platform native locators, and eliminating
context switching entirely; its no-sync model can _reduce_ flakiness on our never-idle app for
**native-first** flows. But its webview story depends on the OS hierarchy (broken on iOS 26) and still
needs the injected-JS bridge for input, whereas Detox's DOM-level web matchers stay robust across iOS
versions. **For a webview-heavy suite that must run on current iOS, Detox remains stronger; Maestro is
compelling for native flows.**
