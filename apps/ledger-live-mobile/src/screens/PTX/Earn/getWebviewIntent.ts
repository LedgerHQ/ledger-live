import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

export type EarnWebviewIntent = "deposit" | "withdraw" | "simulate";

const INTENT_FLOWS = ["deposit", "withdraw", "simulate"] as const;
const INTENTS_SET = new Set<string>(INTENT_FLOWS);

export const isEarnWebviewIntent = (value: string | null | undefined): value is EarnWebviewIntent =>
  INTENTS_SET.has(value ?? "");

/** Reads the earn flow intent from a live-app webview URL (query param, then pathname). */
export const getWebviewIntent = (rawUrl?: string): EarnWebviewIntent | undefined => {
  if (!rawUrl) return undefined;
  const url = safeUrl(rawUrl);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return undefined;

  const queryIntent = url.searchParams.get("intent");
  if (isEarnWebviewIntent(queryIntent)) return queryIntent;

  if (url.pathname.includes("/deposit")) return "deposit";
  if (url.pathname.includes("/withdraw")) return "withdraw";
  if (url.pathname.includes("/earn-simulator")) return "simulate";

  return undefined;
};

/**
 * Tri-state view of whether the webview is currently inside an earn intent flow.
 *
 * The intent is derived from {@link getWebviewIntent} so the two never disagree (a divergence here
 * could bounce the user out of a flow the header still thinks it is in).
 *
 * - `true`  → on an intent route (deposit/withdraw/simulate).
 * - `false` → on a known non-intent route (e.g. the dashboard) — the only signal that the user
 *             has *left* the flow.
 * - `null`  → route not yet known: no URL yet, or a non-http(s) URL (e.g. `about:blank` during
 *             load). Callers must NOT treat `null` as "left the flow" — doing so bounces the user
 *             out before the first real URL arrives.
 */
export const getIntentFlowState = (rawUrl?: string): boolean | null => {
  if (!rawUrl) return null;
  const url = safeUrl(rawUrl);
  if (!url) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return getWebviewIntent(rawUrl) !== undefined;
};
