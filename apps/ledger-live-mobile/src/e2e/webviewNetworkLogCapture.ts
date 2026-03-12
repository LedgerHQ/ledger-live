/**
 * Injected script to capture fetch/XHR network traffic inside WebViews during e2e tests.
 * Posts log entries to React Native via postMessage for attachment to Allure (like desktop WebviewLogCollector).
 */

export const E2E_WEBVIEW_NETWORK_LOG_TYPE = "__E2E_WEBVIEW_NETWORK_LOG__";
export const E2E_WEBVIEW_CONSOLE_LOG_TYPE = "__E2E_WEBVIEW_CONSOLE_LOG__";

export const E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT = `
(function() {
  try {
    var E2E_NETWORK_TYPE = "${E2E_WEBVIEW_NETWORK_LOG_TYPE}";
    var E2E_CONSOLE_TYPE = "${E2E_WEBVIEW_CONSOLE_LOG_TYPE}";

    function sendNetworkLog(entry) {
      try {
        var msg = JSON.stringify({ type: E2E_NETWORK_TYPE, payload: entry });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        }
      } catch (e) {}
    }

    function sendConsoleLog(level, text) {
      try {
        var entry = { timestamp: new Date().toISOString(), level: level, text: String(text) };
        var msg = JSON.stringify({ type: E2E_CONSOLE_TYPE, payload: entry });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        }
      } catch (e) {}
    }

    var origFetch = typeof window.fetch === 'function' && window.fetch;
    if (origFetch) {
      window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var method = (init && init.method) || 'GET';
        var start = Date.now();
        return origFetch.apply(this, arguments).then(function(response) {
          var duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            status: response.status,
            duration: duration
          });
          return response;
        }, function(err) {
          var duration = Date.now() - start;
          sendNetworkLog({
            timestamp: new Date().toISOString(),
            method: method,
            url: url,
            failureText: err && (err.message || String(err)) || 'Request failed'
          });
          throw err;
        });
      };
    }

    if (typeof window.XMLHttpRequest !== 'undefined') {
      var XHR = window.XMLHttpRequest;
      var origOpen = XHR.prototype.open;
      var origSend = XHR.prototype.send;
      if (typeof origOpen === 'function' && typeof origSend === 'function') {
        XHR.prototype.open = function(method, url) {
          this._e2eMethod = method;
          this._e2eUrl = url;
          this._e2eStart = Date.now();
          return origOpen.apply(this, arguments);
        };
        XHR.prototype.send = function() {
          var xhr = this;
          var method = xhr._e2eMethod || 'GET';
          var url = xhr._e2eUrl || '';
          var start = xhr._e2eStart || Date.now();
          xhr.addEventListener('load', function() {
            var duration = Date.now() - start;
            sendNetworkLog({
              timestamp: new Date().toISOString(),
              method: method,
              url: url,
              status: xhr.status,
              duration: duration
            });
          });
          xhr.addEventListener('error', function() {
            var duration = Date.now() - start;
            sendNetworkLog({
              timestamp: new Date().toISOString(),
              method: method,
              url: url,
              failureText: 'XHR error'
            });
          });
          return origSend.apply(xhr, arguments);
        };
      }
    }

    var levels = ['log', 'info', 'warn', 'error', 'debug'];
    for (var i = 0; i < levels.length; i++) {
      var level = levels[i];
      var orig = typeof console[level] === 'function' && console[level];
      if (orig) {
        (function(lvl, fn) {
          console[lvl] = function() {
            try {
              var text = Array.prototype.slice.call(arguments).map(function(a) {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
              }).join(' ');
              sendConsoleLog(lvl, text);
            } catch (e) {}
            return fn.apply(console, arguments);
          };
        })(level, orig);
      }
    }
  } catch (e) {}
  return true;
})();
`;
