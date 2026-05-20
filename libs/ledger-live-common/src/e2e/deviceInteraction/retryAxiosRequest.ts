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

      const isRetryableStatus = !!ax?.response && retryableStatusCodes.includes(ax.response.status);

      const isNetworkError = !!ax && !ax.response;

      const socketHangUp =
        !!ax && typeof ax.message === "string" && ax.message.includes("socket hang up");

      const isRetryableCode = !!ax?.code && RETRYABLE_NODE_CODES.has(ax.code);

      if (
        (isRetryableStatus || isNetworkError || socketHangUp || isRetryableCode) &&
        attempt < maxRetries
      ) {
        const delay = baseDelay * (attempt + 1);
        console.warn(
          `Axios request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
          {
            status: ax?.response?.status ?? "network error",
            message: ax?.message ?? (error as Error).message,
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
