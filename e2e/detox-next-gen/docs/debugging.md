---
name: detox-next-gen-debugging
description: Read when investigating a detox-next-gen test failure — what artifacts are captured on failure and where to find them.
---

# Debugging failures (`helpers/diagnostics.ts`)

When a test fails, the suite snapshots the screen **while the app is still on it**
(from `jest.environment.ts`, before teardown). This covers both a failing **test body**
(`test_fn_failure`) and a failing **setup/teardown hook** (`hook_failure`) — the latter
matters because the swap runner opens the webview in `beforeAll`, so a form-load failure
is a hook failure, not a test failure. The headline artifact is a **merged view hierarchy**.

## The merged view hierarchy

One XML tree combining:

1. **Native hierarchy** from `device.generateViewHierarchyXml(true)` — the `true`
   injects **testIDs**, so a failing locator's testID is matchable against the tree.
2. **Webview DOM** — the live-app webview's `<body>` outerHTML, **spliced in as the
   first child of the native `WebView` node** (wrapped in CDATA). The native tree is
   blind inside a webview (where the swap flow lives); nesting the DOM there lets you
   drill from native chrome straight into the rendered web content.

```xml
<RNCWebView id="wallet-api-webview">      <!-- native WebView node -->
  <webview-dom><![CDATA[ …rendered DOM, data-testids… ]]></webview-dom>
  <RNCWebViewImpl> …                       <!-- original native children follow -->
```

Native-only failure (no webview mounted) → just the native tree. Every capture is
best-effort and timeout-bounded, so it never masks the real failure or hangs teardown.

## Where to find it

In **`allure-results/`** — the single source of truth for a run. The hierarchy is an
attachment on the failing test's `*-result.json` (or, for a `beforeAll` failure, in the
suite's `*-container.json` `befores` → shown under the test's **Set up** in the report).
That same result also carries the test name, status, and the error message (which already
names the failing locator). Everything for one failure lives in one place.

> Attachments only link correctly because `jest-metadata/environment-listener` is registered
> first in `jest.config.js` — without it they're written but orphaned. See that file's comment.

## Investigating with an agent

From `allure-results/`, with no prior knowledge of the run:

1. Find the failure:
   `grep -l '"status":"\(failed\|broken\)"' allure-results/*-result.json`
2. Read its `statusDetails.message` → the failing locator (testID / selector), and
   `attachments[]` → the hierarchy's `source` file (a uuid under `allure-results/attachments/`).
3. Open that file and search for the locator:
   - **Present but off-screen / wrong attrs** → a visibility/scroll/state bug.
   - **Absent from native, present in `<webview-dom>`** → it's a webview element; the
     wait used the wrong surface (native vs web).
   - **Absent from both** → it never rendered; look upstream (the step before).
4. Web waits already name the locator in their timeout error (see `helpers/elements/web`).

## Adding more artifacts

Extend `captureViewHierarchy` in `helpers/diagnostics.ts` (e.g. a Speculos screen
dump, bridge logs, a network capture). Keep each capture independently
`try`/`catch`-guarded and `withTimeout`-bounded.
