import React, { useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

const POLL_INTERVAL = 2000;
const MAX_BODY_LENGTH = 5000;

const INTERCEPT_NETWORK_JS = `
(function() {
  if (window.__ledgerNetworkIntercepted) return;
  window.__ledgerNetworkIntercepted = true;
  window.__ledgerApiLog = [];
  var MAX_BODY = ${MAX_BODY_LENGTH};

  function truncate(s) { return s && s.length > MAX_BODY ? s.slice(0, MAX_BODY) + '...[truncated]' : s; }

  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
    var method = (init && init.method) || 'GET';
    var headers = {};
    if (init && init.headers) {
      if (typeof init.headers.forEach === 'function') {
        init.headers.forEach(function(v, k) { headers[k] = v; });
      } else if (typeof init.headers === 'object') {
        headers = Object.assign({}, init.headers);
      }
    }
    var entry = { url: url, method: method, headers: headers, ts: Date.now(), responseBody: null };
    return origFetch.apply(this, arguments).then(function(resp) {
      entry.status = resp.status;
      entry.responseHeaders = {};
      resp.headers.forEach(function(v, k) { entry.responseHeaders[k] = v; });
      return resp.clone().text().then(function(body) {
        entry.responseBody = truncate(body);
        window.__ledgerApiLog.push(entry);
        if (window.__ledgerApiLog.length > 100) window.__ledgerApiLog.shift();
        return resp;
      });
    }).catch(function(err) {
      entry.error = String(err);
      window.__ledgerApiLog.push(entry);
      return Promise.reject(err);
    });
  };

  var origOpen = XMLHttpRequest.prototype.open;
  var origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__ledgerEntry = { method: method, url: url, headers: {}, ts: Date.now(), responseBody: null };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
    if (this.__ledgerEntry) this.__ledgerEntry.headers[k] = v;
    return origSetHeader.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    var self = this;
    this.addEventListener('loadend', function() {
      if (self.__ledgerEntry) {
        self.__ledgerEntry.status = self.status;
        self.__ledgerEntry.responseBody = truncate(self.responseText || '');
        window.__ledgerApiLog.push(self.__ledgerEntry);
        if (window.__ledgerApiLog.length > 100) window.__ledgerApiLog.shift();
      }
    });
    return origSend.apply(this, arguments);
  };
})();
`;

const READ_ALL_JS = `
(function() {
  var dump = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key) dump[key] = localStorage.getItem(key);
  }
  return JSON.stringify({
    localStorage: dump,
    apiLog: window.__ledgerApiLog || []
  });
})();
`;

export interface ApiLogEntry {
  url: string;
  method: string;
  headers: Record<string, string>;
  responseHeaders?: Record<string, string>;
  status?: number;
  error?: string;
  responseBody?: string | null;
  ts: number;
}

interface WebViewDump {
  localStorage: Record<string, string>;
  apiLog: ApiLogEntry[];
}

interface Props {
  readonly url: string;
  readonly isAuthenticated: boolean;
  readonly onStorageExtracted: (storage: Record<string, string>) => void;
  readonly onApiLogUpdated?: (log: ApiLogEntry[]) => void;
}

export function BaanxLoginForm({
  url,
  isAuthenticated,
  onStorageExtracted,
  onApiLogUpdated,
}: Props) {
  const { t } = useTranslation();
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reloadedOnceRef = useRef(false);

  const pollStorage = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webview
      .executeJavaScript(READ_ALL_JS)
      .then((raw: string) => {
        if (!raw) return;
        try {
          const dump: WebViewDump = JSON.parse(raw);
          if (dump.localStorage && Object.keys(dump.localStorage).length > 0) {
            onStorageExtracted(dump.localStorage);
          }
          if (dump.apiLog && dump.apiLog.length > 0 && onApiLogUpdated) {
            onApiLogUpdated(dump.apiLog);
          }
        } catch {
          /* ignore parse errors */
        }
      })
      .catch(() => {
        /* webview not ready yet */
      });
  }, [onStorageExtracted, onApiLogUpdated]);

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webview
      .executeJavaScript(INTERCEPT_NETWORK_JS)
      .then(() => {
        if (!reloadedOnceRef.current) {
          reloadedOnceRef.current = true;
          webview.reload();
        }
      })
      .catch(() => {});

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(pollStorage, POLL_INTERVAL);
    pollStorage();
  }, [pollStorage]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webview.addEventListener("dom-ready", handleDomReady);

    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [handleDomReady]);

  return (
    <div className="flex flex-1 flex-col gap-16">
      {!isAuthenticated && (
        <div className="text-center">
          <span className="body-2 text-muted">{t("baanxCard.login.subtitle")}</span>
        </div>
      )}
      <webview
        ref={webviewRef}
        src={url}
        className="flex-1 rounded-sm border border-default"
        style={{ minHeight: 500 }}
        // @ts-expect-error Electron webview attributes
        allowpopups=""
      />
    </div>
  );
}
