/**
 * Builds a {@link WebSurface} of action-ready {@link WebHandle}s scoped to one
 * webview. Match strategy is explicit at the factory (`testId` vs `css` vs
 * `id` vs `xpath`) — never inferred from a bare string.
 *
 * `by.web.cssSelector` / `id` / `xpath` work on both iOS and Android;
 * `by.web.value` / `label` / `type` are iOS-only and deliberately not exposed.
 */
import { web, by } from "detox";
import { WebHandle } from "./handle";

/** A set of web-locator factories bound to one webview root. Returned by {@link webView}. */
export interface WebSurface {
  /** Match by React `data-testid`. */
  testId(testId: string): WebHandle;
  /** Match by raw CSS selector (e.g. `[data-testid^="row-"]`). */
  css(selector: string): WebHandle;
  /** Match by HTML `id` attribute — NOT the React testID (use {@link testId} for that). */
  id(htmlId: string): WebHandle;
  /** Match by XPath expression. */
  xpath(expr: string): WebHandle;
}

/**
 * Build a {@link WebSurface} bound to a webview root.
 *
 * @param scope native matcher selecting which webview to target. Omit for the
 * single-webview case (uses Detox's `web` singleton). Required when more than
 * one webview is mounted — the caller supplies the matcher; the lib has no
 * built-in knowledge of any specific webview.
 *
 * @example
 * const w = webView(by.id("checkout-webview"));
 * await w.testId("pay-button").tap({ visible: true });
 */
export function webView(scope?: Detox.NativeMatcher): WebSurface {
  const root: Detox.WebViewElement = scope ? web(scope) : web;
  return {
    testId: testId => new WebHandle(root.element(by.web.cssSelector(`[data-testid="${testId}"]`))),
    css: selector => new WebHandle(root.element(by.web.cssSelector(selector))),
    id: htmlId => new WebHandle(root.element(by.web.id(htmlId))),
    xpath: expr => new WebHandle(root.element(by.web.xpath(expr))),
  };
}
