import { log } from "@ledgerhq/logs";

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
  "EPIPE",
  "ERR_BAD_RESPONSE",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

export type TransientHttpRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Walks error.cause and common wrapper fields to detect transient HTTP failures from DMK,
 * raised by Axios or by the fetch-based `DmkNetworkClientError`.
 */
export function isRetryableSpeculosHttpError(error: unknown): boolean {
  const visit = (e: unknown, depth: number): boolean => {
    if (depth > 10 || e == null) return false;

    if (typeof e !== "object") return false;

    const obj = e as Record<string, unknown>;

    if (typeof obj.code === "string" && RETRYABLE_NETWORK_CODES.has(obj.code)) return true;

    if (obj.isAxiosError === true) {
      const status = (obj.response as { status?: number } | undefined)?.status;
      if (status != null && RETRYABLE_HTTP_STATUSES.has(status)) return true;

      // Node often uses ECONNRESET; some stacks only surface this on the Axios message.
      const msg = String((obj as { message?: string }).message ?? "");
      if (msg.includes("socket hang up")) return true;
    }

    if (obj.name === "DmkNetworkClientError") {
      if (obj.isTimeout === true) return true;
      if (typeof obj.status === "number" && RETRYABLE_HTTP_STATUSES.has(obj.status)) return true;
    }

    const errLike = e as Error & { cause?: unknown };
    if (errLike.cause != null && visit(errLike.cause, depth + 1)) return true;

    for (const key of ["originalError", "error"] as const) {
      if (key in obj && visit(obj[key], depth + 1)) return true;
    }

    return false;
  };

  return visit(error, 0);
}

export async function withTransientHttpRetries<T>(
  label: string,
  fn: () => Promise<T>,
  opts?: TransientHttpRetryOptions,
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 400;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const retryable = isRetryableSpeculosHttpError(e);
      if (!retryable || attempt === maxAttempts) {
        throw e;
      }
      const delayMs = Math.round(baseDelayMs * 2 ** (attempt - 1));
      log(
        "speculos-transport",
        `${label}: transient HTTP failure (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}
