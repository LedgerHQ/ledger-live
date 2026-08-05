import axios, { AxiosError } from "axios";

const RETRYABLE_NODE_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
  "EPIPE",
]);

/**
 * Retries any Axios-based async call on transient failures: retryable HTTP statuses,
 * no-response network errors, common Node socket codes, or "socket hang up"
 * (speculos-device-controller / remote Speculos).
 */
export async function retryAxiosRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000,
  retryableStatusCodes: number[] = [500, 502, 503, 504],
): Promise<T> {
  let lastError: AxiosError | Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as AxiosError | Error;

      const ax = axios.isAxiosError(error) ? error : null;

      const err = error as { status?: number; name?: string; code?: string } | null;
      const status = ax?.response?.status ?? err?.status;
      const code = ax?.code ?? err?.code;
      const message = error instanceof Error ? error.message : String(error);

      const isRetryableStatus = typeof status === "number" && retryableStatusCodes.includes(status);

      const isNetworkError = (!!ax && !ax.response) || err?.name === "NetworkDown";

      const socketHangUp = message.includes("socket hang up");

      const isRetryableCode = !!code && RETRYABLE_NODE_CODES.has(code);

      if (
        (isRetryableStatus || isNetworkError || socketHangUp || isRetryableCode) &&
        attempt < maxRetries
      ) {
        const delay = baseDelay * (attempt + 1);
        console.warn(
          `Axios request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
          {
            status: status ?? err?.name ?? "network error",
            message,
          },
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError!;
}
