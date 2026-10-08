import { HEADER_X_LEDGER_CLIENT_VERSION } from "@shared/api-services";
import type { CalProbeResult } from "../types";
import { PROBE_TIMEOUT_MS } from "./constants";

function isOsOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Probes the call that holds the app at launch (`GET /v1/currencies`, as in `getTokensSyncHash`),
 * minimised to a single id. Never throws: every outcome maps to a {@link CalProbeResult}.
 */
export async function probeCal(
  calServiceUrl: string,
  ledgerClientVersion: string,
): Promise<CalProbeResult> {
  if (isOsOffline()) return "offline";

  // A malformed service URL is a misconfiguration, not connectivity: fail closed.
  let url: URL;
  try {
    url = new URL(`${calServiceUrl}/v1/currencies`);
  } catch {
    return "failed";
  }
  url.searchParams.set("output", "id");
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { [HEADER_X_LEDGER_CLIENT_VERSION]: ledgerClientVersion },
      signal: controller.signal,
    });
    return response.ok ? "ok" : "failed";
  } catch {
    // A rejection that is not our timeout never got an HTTP answer: a network error.
    return timedOut ? "failed" : "offline";
  } finally {
    clearTimeout(timer);
  }
}
