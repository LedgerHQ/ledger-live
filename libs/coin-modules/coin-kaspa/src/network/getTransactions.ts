import { retry } from "@ledgerhq/live-promise";
import { ApiResponseTransaction } from "../types";
import { API_BASE } from "./config";

// Only retry transient failures: network-level errors (e.g. ECONNRESET, surfaced
// as a TypeError by fetch) and 5xx responses. Not 4xx or response-parsing errors.
const isRetriableError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return true;
  }
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 500
  );
};

export const getTransactions = async (
  address: string,
  after: number = 1,
): Promise<{ transactions: ApiResponseTransaction[]; nextPageAfter: string | null }> => {
  const url = new URL(`/addresses/${encodeURIComponent(address)}/full-transactions-page`, API_BASE);
  url.searchParams.set("resolve_previous_outpoints", "light");
  url.searchParams.set("limit", "500");
  url.searchParams.set("before", "0");
  url.searchParams.set("after", String(after));

  return retry(
    async () => {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw Object.assign(new Error("Network response was not ok."), {
          status: response.status,
        });
      }

      const nextPageAfter = response.headers.get("X-Next-Page-After") || null;
      const transactions = await response.json();

      return { transactions, nextPageAfter };
    },
    { maxRetry: 3, context: "kaspa-getTransactions", retryCondition: isRetriableError },
  );
};
