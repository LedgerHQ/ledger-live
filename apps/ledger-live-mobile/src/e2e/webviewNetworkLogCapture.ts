/**
 * Injected script to capture fetch/XHR network traffic inside WebViews during e2e tests.
 * Posts log entries to React Native via postMessage for attachment to Allure (like desktop WebviewLogCollector).
 * No outer IIFE (RN WebView injects the source as-is); locals are block-scoped with let/const. Ends with `true` for RN WebView.
 */

export const E2E_WEBVIEW_NETWORK_LOG_TYPE = "__E2E_WEBVIEW_NETWORK_LOG__";
export const E2E_WEBVIEW_CONSOLE_LOG_TYPE = "__E2E_WEBVIEW_CONSOLE_LOG__";

export const E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT = `
try {
  const E2E_NETWORK_TYPE = "${E2E_WEBVIEW_NETWORK_LOG_TYPE}";
  const E2E_CONSOLE_TYPE = "${E2E_WEBVIEW_CONSOLE_LOG_TYPE}";

  const sendNetworkLog = function (entry) {
    try {
      const msg = JSON.stringify({ type: E2E_NETWORK_TYPE, payload: entry });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
    } catch (e) {}
  };

  const sendConsoleLog = function (level, text) {
    try {
      const entry = { timestamp: new Date().toISOString(), level: level, text: String(text) };
      const msg = JSON.stringify({ type: E2E_CONSOLE_TYPE, payload: entry });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
    } catch (e) {}
  };

  const origFetch = typeof window.fetch === "function" && window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const method = (init && init.method) || "GET";
      const start = Date.now();
      return origFetch.apply(this, arguments).then(
        function (response) {
          const duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            status: response.status,
            duration: duration,
          });
          return response;
        },
        function (err) {
          const duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            failureText: (err && (err.message || String(err))) || "Request failed",
          });
          throw err;
        },
      );
    };
  }

  if (typeof window.XMLHttpRequest !== "undefined") {
    const XHR = window.XMLHttpRequest;
    const origOpen = XHR.prototype.open;
    const origSend = XHR.prototype.send;
    if (typeof origOpen === "function" && typeof origSend === "function") {
      XHR.prototype.open = function (method, url) {
        this._e2eMethod = method;
        this._e2eUrl = url;
        this._e2eStart = Date.now();
        return origOpen.apply(this, arguments);
      };
      XHR.prototype.send = function () {
        const xhr = this;
        const method = xhr._e2eMethod || "GET";
        const url = xhr._e2eUrl || "";
        const start = xhr._e2eStart || Date.now();
        xhr.addEventListener("load", function () {
          const duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            status: xhr.status,
            duration: duration,
          });
        });
        xhr.addEventListener("error", function () {
          const duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            failureText: "XHR error",
          });
        });
        return origSend.apply(xhr, arguments);
      };
    }
  }

  const levels = ["log", "info", "warn", "error", "debug"];
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const orig = typeof console[level] === "function" && console[level];
    if (orig) {
      (function (lvl, fn) {
        console[lvl] = function () {
          try {
            const text = Array.prototype.slice
              .call(arguments)
              .map(function (a) {
                return typeof a === "object" ? JSON.stringify(a) : String(a);
              })
              .join(" ");
            sendConsoleLog(lvl, text);
          } catch (e) {}
          return fn.apply(console, arguments);
        };
      })(level, orig);
    }
  }
} catch (e) {}
true;
`;
