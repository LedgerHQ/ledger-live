import { E2E_WEBVIEW_DRIVER_RESULT_TYPE } from "./webviewDriverStore";

export type WebviewDriverOp =
  | { op: "tapByTestId"; testId: string }
  | { op: "waitForTestId"; testId: string; timeoutMs?: number }
  | { op: "getText"; testId: string }
  | { op: "typeText"; testId: string; value: string }
  | { op: "querySelectorAllText"; selector: string };

export type WebviewDriverResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

/**
 * Builds a JS snippet that runs the requested DOM op inside the WebView and
 * posts the result back to the host via window.ReactNativeWebView.postMessage.
 * The host app's onMessage handler forwards `__E2E_WEBVIEW_DRIVER_RESULT__`
 * payloads back to the bridge.
 */
export function buildWebviewDriverScript(id: string, op: WebviewDriverOp): string {
  return `
(function() {
  function postResult(result) {
    try {
      var msg = JSON.stringify({
        type: ${JSON.stringify(E2E_WEBVIEW_DRIVER_RESULT_TYPE)},
        id: ${JSON.stringify(id)},
        payload: result,
      });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
    } catch (e) {}
  }
  function findByTestId(testId) {
    return document.querySelector('[data-testid="' + testId + '"]');
  }
  function waitFor(testId, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 30000);
    function tick() {
      var el = findByTestId(testId);
      if (el) {
        postResult({ ok: true });
        return;
      }
      if (Date.now() > deadline) {
        postResult({ ok: false, error: 'Timeout waiting for [data-testid="' + testId + '"]' });
        return;
      }
      setTimeout(tick, 100);
    }
    tick();
  }
  try {
    var op = ${JSON.stringify(op)};
    switch (op.op) {
      case "tapByTestId": {
        var el = findByTestId(op.testId);
        if (!el) {
          postResult({ ok: false, error: 'Element not found [data-testid="' + op.testId + '"]' });
          return;
        }
        if (typeof el.click === "function") el.click();
        else if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        postResult({ ok: true });
        return;
      }
      case "waitForTestId": {
        waitFor(op.testId, op.timeoutMs);
        return;
      }
      case "getText": {
        var el = findByTestId(op.testId);
        if (!el) { postResult({ ok: false, error: 'Element not found' }); return; }
        postResult({ ok: true, data: (el.textContent || "").trim() });
        return;
      }
      case "typeText": {
        var el = findByTestId(op.testId);
        if (!el) { postResult({ ok: false, error: 'Element not found' }); return; }
        if (typeof el.focus === "function") el.focus();
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
        if (setter && setter.set) setter.set.call(el, op.value);
        else el.value = op.value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        postResult({ ok: true });
        return;
      }
      case "querySelectorAllText": {
        var nodes = document.querySelectorAll(op.selector);
        var texts = [];
        for (var i = 0; i < nodes.length; i++) texts.push((nodes[i].textContent || "").trim());
        postResult({ ok: true, data: texts });
        return;
      }
      default:
        postResult({ ok: false, error: "Unknown webview driver op" });
    }
  } catch (err) {
    postResult({ ok: false, error: (err && err.message) || String(err) });
  }
})();
true;
`;
}
