/** Cap aligned with the app splash wait so a hanging CAL cannot block launch past it. */
export const CAL_HEALTHCHECK_TIMEOUT_MS = 1_000;

const LEDGER_CLIENT_VERSION_HEADER = "X-Ledger-Client-Version";

export type CalHealthResult = "ok" | "failed" | "offline";

export type CheckCalHealthOptions = Readonly<{
  calServiceUrl: string;
  ledgerClientVersion: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  isOffline?: () => boolean;
}>;

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

function reportOsOffline(isOffline: (() => boolean) | undefined): boolean {
  if (isOffline !== undefined) {
    return isOffline();
  }
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function isHttpUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

export async function checkCalHealth({
  calServiceUrl,
  ledgerClientVersion,
  timeoutMs = CAL_HEALTHCHECK_TIMEOUT_MS,
  fetchImpl = fetch,
  isOffline,
}: CheckCalHealthOptions): Promise<CalHealthResult> {
  if (reportOsOffline(isOffline)) {
    return "offline";
  }

  let url: URL;
  try {
    if (calServiceUrl.trim().length === 0) {
      return "failed";
    }
    url = new URL(`${calServiceUrl.replace(/\/$/, "")}/v1/currencies`);
    url.searchParams.set("output", "id");
    url.searchParams.set("limit", "1");
  } catch {
    return "failed";
  }

  if (!isHttpUrl(url)) {
    return "failed";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        [LEDGER_CLIENT_VERSION_HEADER]: ledgerClientVersion,
      },
    });
    if (!response.ok) {
      return "failed";
    }
    return "ok";
  } catch (error) {
    if (isAbortError(error)) {
      return "failed";
    }
    if (isNetworkError(error)) {
      return "offline";
    }
    return "failed";
  } finally {
    clearTimeout(timeoutId);
  }
}
