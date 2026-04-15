import React, { useState, useMemo } from "react";
import type { ApiLogEntry } from "./BaanxLoginForm";

function isApiCall(entry: ApiLogEntry): boolean {
  const url = entry.url.toLowerCase();
  return (
    url.includes("/v1/") ||
    url.includes("/api/") ||
    url.includes("baanx") ||
    (url.startsWith("http") && !url.match(/\.(js|css|png|jpg|svg|woff|ico|map)(\?|$)/i))
  );
}

function tryFormatJson(raw: string | null | undefined): { formatted: string; isJson: boolean } {
  if (!raw) return { formatted: "(empty)", isJson: false };
  try {
    const parsed = JSON.parse(raw);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: raw, isJson: false };
  }
}

function ApiCallRow({ entry, defaultOpen }: { readonly entry: ApiLogEntry; readonly defaultOpen: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const { formatted, isJson } = useMemo(() => tryFormatJson(entry.responseBody), [entry.responseBody]);
  const statusColor =
    entry.status && entry.status < 300
      ? "text-green-600"
      : entry.status && entry.status < 400
        ? "text-yellow-600"
        : "text-error";

  const pathname = (() => {
    try {
      return new URL(entry.url).pathname;
    } catch {
      return entry.url;
    }
  })();

  return (
    <div className="rounded-sm border border-default">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-8 px-12 py-8 text-left text-xs hover:bg-surface-hover"
      >
        <span className="font-mono text-muted">{entry.method}</span>
        <span className={`font-mono ${statusColor}`}>{entry.status ?? "ERR"}</span>
        <span className="flex-1 truncate font-mono">{pathname}</span>
        <span className="text-muted">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="border-t border-default px-12 py-8">
          <div className="mb-8 flex flex-col gap-4">
            <span className="text-xs font-medium text-muted">Full URL</span>
            <code className="break-all text-xs">{entry.url}</code>
          </div>

          {Object.keys(entry.headers).length > 0 && (
            <div className="mb-8 flex flex-col gap-4">
              <span className="text-xs font-medium text-muted">Request Headers</span>
              <pre className="max-h-[150px] overflow-auto rounded-sm bg-surface p-8 text-xs">
                {JSON.stringify(entry.headers, null, 2)}
              </pre>
            </div>
          )}

          {entry.responseHeaders && Object.keys(entry.responseHeaders).length > 0 && (
            <div className="mb-8 flex flex-col gap-4">
              <span className="text-xs font-medium text-muted">Response Headers</span>
              <pre className="max-h-[150px] overflow-auto rounded-sm bg-surface p-8 text-xs">
                {JSON.stringify(entry.responseHeaders, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <span className="text-xs font-medium text-muted">
              Response Body {isJson && <span className="text-green-600">(JSON)</span>}
            </span>
            <pre className="max-h-[400px] overflow-auto rounded-sm bg-surface p-8 text-xs leading-relaxed">
              {formatted}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface RawDataTabProps {
  readonly webViewStorage: Record<string, string>;
  readonly apiLog: ApiLogEntry[];
  readonly isAuthenticated: boolean;
}

export function RawDataTab({ webViewStorage, apiLog, isAuthenticated }: RawDataTabProps) {
  const storageKeys = Object.keys(webViewStorage);
  const [showAllRequests, setShowAllRequests] = useState(false);

  const apiCalls = useMemo(() => {
    const filtered = showAllRequests ? apiLog : apiLog.filter(isApiCall);
    return [...filtered].reverse();
  }, [apiLog, showAllRequests]);

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <span className="body-2-semi-bold text-base">
            Intercepted Network Requests ({apiCalls.length}/{apiLog.length})
          </span>
          <label className="flex items-center gap-4 text-xs text-muted">
            <input
              type="checkbox"
              checked={showAllRequests}
              onChange={e => setShowAllRequests(e.target.checked)}
            />
            Show all (incl. static assets)
          </label>
        </div>

        {apiCalls.length === 0 ? (
          <div className="rounded-sm border border-default bg-surface p-16 text-center text-sm text-muted">
            No API calls intercepted yet. Log in and interact with the Baanx app, then come back here.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {apiCalls.map((entry, i) => (
              <ApiCallRow key={`${entry.ts}-${i}`} entry={entry} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <span className="body-2-semi-bold text-base">
          WebView localStorage ({storageKeys.length} keys)
          {isAuthenticated && <span className="ml-8 text-green-600">Token found</span>}
        </span>
        <pre className="max-h-[300px] overflow-auto rounded-sm border border-default bg-surface p-12 text-xs leading-relaxed text-base">
          {storageKeys.length > 0
            ? JSON.stringify(webViewStorage, null, 2)
            : "No data yet — log in to the Baanx app first."}
        </pre>
      </div>
    </div>
  );
}
