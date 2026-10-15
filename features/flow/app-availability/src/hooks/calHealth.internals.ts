/** Cap aligned with the app splash wait so a hanging CAL cannot block launch past it. */
export const CAL_HEALTHCHECK_TIMEOUT_MS = 1_000;

const LEDGER_CLIENT_VERSION_HEADER = "X-Ledger-Client-Version";

export type CalHealthResult = "ok" | "failed" | "offline";

type IsOffline = () => boolean | Promise<boolean>;

export type CheckCalHealthOptions = Readonly<{
  calServiceUrl: string;
  ledgerClientVersion: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  isOffline?: IsOffline;
}>;

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

async function reportOsOffline(isOffline: IsOffline | undefined): Promise<boolean> {
  if (isOffline !== undefined) {
    return isOffline();
  }
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function failedUnlessOffline(isOffline: IsOffline | undefined): Promise<CalHealthResult> {
  if (await reportOsOffline(isOffline)) {
    return "offline";
  }
  return "failed";
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
  if (await reportOsOffline(isOffline)) {
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
    if (response.status >= 500) {
      return "failed";
    }
    return "ok";
  } catch (error) {
    if (isNetworkError(error)) {
      return "offline";
    }
    return await failedUnlessOffline(isOffline);
  } finally {
    clearTimeout(timeoutId);
  }
}
