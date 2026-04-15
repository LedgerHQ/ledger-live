export const BAANX_WEB_APP_URL = "https://ledger-ui.baanx.co.uk/iframeV2/view/";

/**
 * JS snippet injected into the Baanx WebView to extract auth tokens.
 * The Baanx SPA stores tokens in localStorage after a successful login.
 * This script polls localStorage every second and posts a message
 * when a token is found.
 */
export const BAANX_TOKEN_EXTRACTION_JS = `
(function() {
  var POLL_INTERVAL = 1000;
  var STORAGE_KEYS = ['access_token', 'accessToken', 'token', 'auth_token', 'jwt'];

  function findToken() {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      var lk = key.toLowerCase();

      for (var j = 0; j < STORAGE_KEYS.length; j++) {
        if (lk.indexOf(STORAGE_KEYS[j].toLowerCase()) !== -1) {
          var val = localStorage.getItem(key);
          if (val && val.length > 20) {
            return { key: key, value: val };
          }
        }
      }
    }
    return null;
  }

  function dumpStorage() {
    var dump = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key) dump[key] = localStorage.getItem(key);
    }
    return dump;
  }

  var timer = setInterval(function() {
    var found = findToken();
    if (found) {
      clearInterval(timer);
      window.ReactNativeWebView
        ? window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'baanx-auth',
            token: found.value,
            storageKey: found.key,
            storage: dumpStorage()
          }))
        : window.postMessage(JSON.stringify({
            type: 'baanx-auth',
            token: found.value,
            storageKey: found.key,
            storage: dumpStorage()
          }), '*');
    }
  }, POLL_INTERVAL);
})();
`;

export interface BaanxWebViewTokenResult {
  accessToken: string;
  rawStorage: Record<string, string>;
}

/**
 * Parse a message posted from the Baanx WebView.
 * Returns the extracted token if the message is a valid baanx-auth event.
 */
export function parseBaanxWebViewMessage(data: string): BaanxWebViewTokenResult | null {
  try {
    const msg = JSON.parse(data);
    if (msg.type !== "baanx-auth" || !msg.token) return null;
    return {
      accessToken: msg.token,
      rawStorage: msg.storage ?? {},
    };
  } catch {
    return null;
  }
}

