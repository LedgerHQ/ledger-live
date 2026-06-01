import { E2E_WEBVIEW_DRIVER_RESULT_TYPE } from "./webviewDriverStore";

export type WebviewDriverOp =
  | { op: "tapByTestId"; testId: string }
  | { op: "tapByTestIdWhenEnabled"; testId: string; timeoutMs?: number }
  | { op: "waitForTestId"; testId: string; timeoutMs?: number }
  | { op: "waitForTestIdText"; testId: string; text: string; timeoutMs?: number }
  | { op: "waitForTestIdNumberAtLeast"; testId: string; min: number; timeoutMs?: number }
  | { op: "getText"; testId: string }
  | { op: "typeText"; testId: string; value: string }
  | { op: "querySelectorAllText"; selector: string };

export type WebviewDriverResult = { ok: true; data?: unknown } | { ok: false; error: string };

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
  function waitForText(testId, text, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 30000);
    function tick() {
      var el = findByTestId(testId);
      if (el && (el.textContent || "").indexOf(text) !== -1) {
        postResult({ ok: true });
        return;
      }
      if (Date.now() > deadline) {
        postResult({
          ok: false,
          error: 'Timeout waiting for [data-testid="' + testId + '"] to contain "' + text + '"',
        });
        return;
      }
      setTimeout(tick, 100);
    }
    tick();
  }
  function waitForNumberAtLeast(testId, min, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 30000);
    function tick() {
      var el = findByTestId(testId);
      if (el) {
        var digits = (el.textContent || "").replace(/[^0-9]/g, "");
        var value = digits ? parseInt(digits, 10) : NaN;
        if (!isNaN(value) && value >= min) {
          postResult({ ok: true });
          return;
        }
      }
      if (Date.now() > deadline) {
        postResult({
          ok: false,
          error: 'Timeout waiting for [data-testid="' + testId + '"] number >= ' + min,
        });
        return;
      }
      setTimeout(tick, 100);
    }
    tick();
  }
  // Mirror Detox's isWebElementEnabled: an element is considered disabled when
  // it carries a disabled-ish attribute (disabled / aria-disabled / data-disabled),
  // unless that attribute is explicitly "false".
  function isEnabled(el) {
    if (!el) return false;
    if (el.disabled === true) return false;
    var names = (el.getAttributeNames && el.getAttributeNames()) || [];
    for (var i = 0; i < names.length; i++) {
      if (names[i].indexOf("disabled") !== -1 && el.getAttribute(names[i]) !== "false") {
        return false;
      }
    }
    return true;
  }
  function performTap(el) {
    // Blur any focused field (e.g. the amount input keeping the keyboard
    // up) so the tap lands on a settled form, like a real tap would.
    if (
      document.activeElement &&
      document.activeElement !== el &&
      typeof document.activeElement.blur === "function"
    ) {
      try { document.activeElement.blur(); } catch (e) {}
    }
    if (typeof el.scrollIntoView === "function") {
      try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (e) {}
    }
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    // The testid is sometimes on a wrapper while the press handler lives on a
    // child node. Target the topmost element actually rendered at the centre
    // so the dispatched events bubble through whichever node holds the
    // handler, exactly like a real tap. Fall back to the testid element.
    var target = el;
    if (typeof document.elementFromPoint === "function") {
      var hit = document.elementFromPoint(cx, cy);
      if (hit && (hit === el || el.contains(hit) || hit.contains(el))) {
        target = hit;
      }
    }
    var dispatch = function (type, Ctor, extra) {
      try {
        var init = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          clientX: cx,
          clientY: cy,
        };
        if (extra) {
          for (var k in extra) init[k] = extra[k];
        }
        target.dispatchEvent(new Ctor(type, init));
      } catch (e) {}
    };
    // React Native Web pressables ignore a bare click(); drive the full
    // pointer + mouse sequence (with coordinates), then click() to fire the
    // actual onPress/onClick exactly once.
    if (typeof window.PointerEvent === "function") {
      dispatch("pointerdown", PointerEvent, { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0 });
      dispatch("pointerup", PointerEvent, { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0 });
    }
    dispatch("mousedown", MouseEvent, { button: 0 });
    dispatch("mouseup", MouseEvent, { button: 0 });
    if (typeof target.click === "function") {
      try { target.click(); } catch (e) { dispatch("click", MouseEvent, { button: 0 }); }
    } else {
      dispatch("click", MouseEvent, { button: 0 });
    }
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
        performTap(el);
        postResult({ ok: true });
        return;
      }
      case "tapByTestIdWhenEnabled": {
        // Poll inside the WebView until the element is present AND enabled, then
        // tap it in the same script. Doing the wait + tap atomically avoids a
        // race where the button re-disables (e.g. while a quote refreshes)
        // between a separate "wait" and "tap" round-trip over the bridge.
        var enabledDeadline = Date.now() + (op.timeoutMs || 30000);
        var attempt = function () {
          var node = findByTestId(op.testId);
          if (node && isEnabled(node)) {
            performTap(node);
            postResult({ ok: true });
            return;
          }
          if (Date.now() > enabledDeadline) {
            postResult({
              ok: false,
              error: 'Timeout waiting for enabled [data-testid="' + op.testId + '"]',
            });
            return;
          }
          setTimeout(attempt, 100);
        };
        attempt();
        return;
      }
      case "waitForTestId": {
        waitFor(op.testId, op.timeoutMs);
        return;
      }
      case "waitForTestIdText": {
        waitForText(op.testId, op.text, op.timeoutMs);
        return;
      }
      case "waitForTestIdNumberAtLeast": {
        waitForNumberAtLeast(op.testId, op.min, op.timeoutMs);
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
