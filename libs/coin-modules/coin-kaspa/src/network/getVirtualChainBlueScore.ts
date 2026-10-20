import { retry } from "@ledgerhq/coin-module-framework/promises";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getVirtualChainBlueScore = async (): Promise<number> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/info/virtual-chain-blue-score`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw httpError(
          `Failed to fetch virtual-chain-blue-score. Status: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()).blueScore as number;
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Error fetching virtual chain blue score: ${(error as Error).message}`);
  }
};
