// THROWAWAY DIAGNOSTIC — do not merge.
//
// Answers the one thing the fix cannot prove from the repo: is the Firebase on-disk cache
// (IndexedDB) actually alive in a *packaged* LLD, whose renderer loads from `file://`? Dev runs on
// `http://localhost`, so only a packaged build answers it.
//
// Renders a plain DOM overlay rather than a React one so it survives a broken boot and needs no
// devtools (packaged builds ship with them disabled).

type Probe = {
  origin: string;
  idbNames: string | null;
  idbError: string | null;
  cacheMs: number | null;
  cacheCount: number | null;
  cacheWalletSync: string | null;
  cacheError: string | null;
  fetchMs: number | null;
  fetchOutcome: string | null;
  fetchCount: number | null;
};

const started = Date.now();

const probe: Probe = {
  origin: typeof window === "undefined" ? "n/a" : window.location.origin || window.location.href,
  idbNames: null,
  idbError: null,
  cacheMs: null,
  cacheCount: null,
  cacheWalletSync: null,
  cacheError: null,
  fetchMs: null,
  fetchOutcome: null,
  fetchCount: null,
};

const since = () => Date.now() - started;

export function recordCacheRead(flags: Record<string, unknown>) {
  probe.cacheMs = since();
  probe.cacheCount = Object.keys(flags).length;
  probe.cacheWalletSync = describeWalletSync(flags["lldWalletSync"]);
  render();
}

export function recordCacheError(error: unknown) {
  probe.cacheMs = since();
  probe.cacheError = String(error);
  render();
}

export function recordFetch(
  outcome: "ok" | "failed",
  flagsOrError: Record<string, unknown> | unknown,
) {
  probe.fetchMs = since();
  probe.fetchOutcome = outcome;
  if (outcome === "ok") {
    probe.fetchCount = Object.keys(flagsOrError as Record<string, unknown>).length;
  } else {
    probe.fetchOutcome = `failed: ${String(flagsOrError)}`;
  }
  render();
}

function describeWalletSync(value: unknown): string {
  if (!value || typeof value !== "object") return "absent";
  const feature = value as { enabled?: boolean; params?: { environment?: string } };
  return `enabled=${feature.enabled} env=${feature.params?.environment}`;
}

let node: HTMLElement | null = null;

function ensureNode(): HTMLElement | null {
  if (typeof document === "undefined" || !document.body) return null;
  if (!node) {
    node = document.createElement("pre");
    node.id = "ff-cache-probe";
    node.style.cssText = [
      "position:fixed",
      "left:8px",
      "bottom:8px",
      "z-index:2147483647",
      "margin:0",
      "padding:8px 10px",
      "max-width:560px",
      "background:rgba(0,0,0,.86)",
      "color:#7CFF9B",
      "font:11px/1.45 ui-monospace,Menlo,monospace",
      "white-space:pre-wrap",
      "border:1px solid #7CFF9B",
      "border-radius:6px",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(node);
  }
  return node;
}

function verdict(): string {
  if (probe.cacheError) return "CACHE UNREADABLE";
  if (probe.cacheCount === null) return "waiting for cache read...";
  if (probe.cacheCount === 0) return "CACHE EMPTY (cold, or IndexedDB refused)";
  return `CACHE ALIVE — ${probe.cacheCount} flags served with no network`;
}

function render() {
  const el = ensureNode();
  if (!el) return;
  el.textContent = [
    `FF CACHE PROBE   ${verdict()}`,
    `origin        ${probe.origin}`,
    `indexeddb     ${probe.idbError ?? probe.idbNames ?? "..."}`,
    `cache read    ${probe.cacheMs === null ? "..." : `+${probe.cacheMs}ms`}  count=${probe.cacheCount ?? "-"}  ${probe.cacheError ?? ""}`,
    `  lldWalletSync ${probe.cacheWalletSync ?? "-"}`,
    `network fetch ${probe.fetchMs === null ? "pending" : `+${probe.fetchMs}ms`}  ${probe.fetchOutcome ?? ""}  count=${probe.fetchCount ?? "-"}`,
  ].join("\n");
}

/**
 * Call once at renderer bootstrap. Lists the IndexedDB databases, which is the direct answer to
 * whether Chromium grants storage to the `file://` origin, then paints the overlay.
 */
export function startCacheProbe() {
  render();
  const idb = typeof indexedDB === "undefined" ? null : indexedDB;
  if (!idb) {
    probe.idbError = "indexedDB is undefined";
    render();
    return;
  }
  if (typeof idb.databases !== "function") {
    probe.idbNames = "databases() unsupported (cannot enumerate)";
    render();
    return;
  }
  idb
    .databases()
    .then(dbs => {
      const names = dbs.map(db => db.name).filter(Boolean);
      probe.idbNames = names.length ? names.join(", ") : "none";
      render();
    })
    .catch(error => {
      probe.idbError = `databases() threw: ${String(error)}`;
      render();
    });
}
