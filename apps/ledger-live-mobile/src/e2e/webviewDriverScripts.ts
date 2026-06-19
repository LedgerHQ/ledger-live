import { E2E_WEBVIEW_DRIVER_RESULT_TYPE } from "./webviewDriverStore";

export type WebviewDriverOp =
  | { op: "tapByTestId"; testId: string }
  | { op: "tapByTestIdWhenEnabled"; testId: string; timeoutMs?: number }
  | { op: "tapBySelectorWhenEnabled"; selector: string; timeoutMs?: number }
  | { op: "waitForTestId"; testId: string; timeoutMs?: number }
  | { op: "waitForTestIdText"; testId: string; text: string; timeoutMs?: number }
  | { op: "waitForTestIdNumberAtLeast"; testId: string; min: number; timeoutMs?: number }
  | {
      op: "waitForTestIdNumberInRange";
      testId: string;
      min: number;
      max: number;
      timeoutMs?: number;
    }
  | {
      op: "waitForSelectorMatches";
      selector: string;
      pattern: string;
      flags?: string;
      timeoutMs?: number;
    }
  | {
      op: "waitForSelectorTextsMatchingCount";
      countTestId: string;
      selector: string;
      timeoutMs?: number;
    }
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
  var DEFAULT_TIMEOUT_MS = 30000;
  var POLL_INTERVAL_MS = 100;
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
  // Generic poll loop shared by every "wait until ..." op. check() returns a
  // truthy value (often the element) on success; onSuccess defaults to posting
  // { ok: true } but tap-when-enabled overrides it to tap in the same tick.
  function poll(check, timeoutMs, timeoutError, onSuccess) {
    var deadline = Date.now() + (timeoutMs || DEFAULT_TIMEOUT_MS);
    function tick() {
      var hit = check();
      if (hit) {
        if (onSuccess) onSuccess(hit);
        else postResult({ ok: true });
        return;
      }
      if (Date.now() > deadline) {
        postResult({ ok: false, error: timeoutError() });
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
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
        poll(
          function () { var node = findByTestId(op.testId); return node && isEnabled(node) ? node : null; },
          op.timeoutMs,
          function () { return 'Timeout waiting for enabled [data-testid="' + op.testId + '"]'; },
          function (node) { performTap(node); postResult({ ok: true }); }
        );
        return;
      }
      case "tapBySelectorWhenEnabled": {
        // Same atomic wait+tap as tapByTestIdWhenEnabled, but targeting an
        // arbitrary CSS selector. Used to tap an element scoped to a parent
        // (e.g. the execute button inside a specific swap quote container) when
        // several elements share the same data-testid.
        poll(
          function () { var node = document.querySelector(op.selector); return node && isEnabled(node) ? node : null; },
          op.timeoutMs,
          function () { return 'Timeout waiting for enabled "' + op.selector + '"'; },
          function (node) { performTap(node); postResult({ ok: true }); }
        );
        return;
      }
      case "waitForTestId": {
        poll(
          function () { return findByTestId(op.testId); },
          op.timeoutMs,
          function () { return 'Timeout waiting for [data-testid="' + op.testId + '"]'; }
        );
        return;
      }
      case "waitForTestIdText": {
        poll(
          function () {
            var el = findByTestId(op.testId);
            return el && (el.textContent || "").indexOf(op.text) !== -1;
          },
          op.timeoutMs,
          function () {
            return 'Timeout waiting for [data-testid="' + op.testId + '"] to contain "' + op.text + '"';
          }
        );
        return;
      }
      case "waitForTestIdNumberAtLeast": {
        poll(
          function () {
            var el = findByTestId(op.testId);
            if (!el) return false;
            var digits = (el.textContent || "").replace(/[^0-9]/g, "");
            var value = digits ? parseInt(digits, 10) : NaN;
            return !isNaN(value) && value >= op.min;
          },
          op.timeoutMs,
          function () {
            return 'Timeout waiting for [data-testid="' + op.testId + '"] number >= ' + op.min;
          }
        );
        return;
      }
      case "waitForTestIdNumberInRange": {
        poll(
          function () {
            var el = findByTestId(op.testId);
            if (!el) return false;
            var digits = (el.textContent || "").replace(/[^0-9]/g, "");
            var value = digits ? parseInt(digits, 10) : NaN;
            return !isNaN(value) && value >= op.min && value <= op.max;
          },
          op.timeoutMs,
          function () {
            return (
              'Timeout waiting for [data-testid="' +
              op.testId +
              '"] number in [' + op.min + ", " + op.max + "]"
            );
          }
        );
        return;
      }
      case "waitForSelectorMatches": {
        var matchRe = new RegExp(op.pattern, op.flags || "");
        poll(
          function () {
            var node = document.querySelector(op.selector);
            if (!node) return null;
            var text = (node.innerText || node.textContent || "").trim();
            return matchRe.test(text) ? text : null;
          },
          op.timeoutMs,
          function () {
            return 'Timeout waiting for "' + op.selector + '" text to match /' + op.pattern + "/";
          },
          function (text) { postResult({ ok: true, data: text }); }
        );
        return;
      }
      case "waitForSelectorTextsMatchingCount": {
        poll(
          function () {
            var countEl = findByTestId(op.countTestId);
            if (!countEl) return null;
            var countDigits = (countEl.textContent || "").replace(/[^0-9]/g, "");
            var expected = countDigits ? parseInt(countDigits, 10) : NaN;
            if (isNaN(expected) || expected <= 0) return null;
            var matched = document.querySelectorAll(op.selector);
            if (matched.length !== expected) return null;
            var collected = [];
            for (var m = 0; m < matched.length; m++) {
              collected.push((matched[m].innerText || matched[m].textContent || "").trim());
            }
            return collected;
          },
          op.timeoutMs,
          function () {
            return (
              'Timeout waiting for "' +
              op.selector +
              '" count to match [data-testid="' + op.countTestId + '"]'
            );
          },
          function (texts) { postResult({ ok: true, data: texts }); }
        );
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
