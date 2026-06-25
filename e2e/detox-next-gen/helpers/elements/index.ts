/**
 * Elements lib for the Detox Next Gen suite.
 *
 * App-agnostic, action-ready element handles. Each locator is built via a
 * strategy-named factory, so the match strategy is explicit at definition
 * (no "a raw string means testID" guessing) and the locator carries its own
 * wait-then-act methods:
 *
 *   import { byId, byText, webView } from "../helpers/elements";
 *   import { by } from "detox";
 *
 *   await byId("submit-button").tap();       // native testID
 *   await byText("Discover").waitVisible();   // native by.text
 *
 *   // webview: build a surface scoped to the webview, then match within it
 *   const w = webView(by.id("my-webview"));
 *   await w.testId("pay-button").tap({ visible: true });
 *   await w.css("[data-testid^='row-']").wait();
 *
 * Native factories live in `./native` (`byId/byText/byLabel/byType/byMatcher`
 * → {@link NativeHandle}); the webview surface lives in `./web`
 * (`webView(scope).testId/css/id/xpath` → {@link WebHandle}). The handle is the
 * sole native impl; `el()` is the escape-hatch resolver to a raw Detox element.
 */
export * from "./native";
export * from "./web";
