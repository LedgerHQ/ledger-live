import { log } from "@ledgerhq/logs";

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const RETRYABLE_AXIOS_NETWORK_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
  "EPIPE",
  "ERR_BAD_RESPONSE",
]);

export type TransientHttpRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Walks error.cause and common wrapper fields to detect Axios / transient HTTP failures from DMK. */
export function isRetryableSpeculosHttpError(error: unknown): boolean {
  const visit = (e: unknown, depth: number): boolean => {
    if (depth > 10 || e == null) return false;

    if (typeof e !== "object") return false;

    const obj = e as Record<string, unknown>;

    if (obj.isAxiosError === true) {
      const status = (obj.response as { status?: number } | undefined)?.status;
      if (status != null && RETRYABLE_HTTP_STATUSES.has(status)) return true;

      const code = obj.code;
      if (typeof code === "string" && RETRYABLE_AXIOS_NETWORK_CODES.has(code)) return true;

      // Node often uses ECONNRESET; some stacks only surface this on the Axios message.
      const msg = String((obj as { message?: string }).message ?? "");
      if (msg.includes("socket hang up")) return true;
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
