import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseFeeEstimate } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getFeeEstimate = async (): Promise<ApiResponseFeeEstimate> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/info/fee-estimate`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw httpError("Network response was not ok", response.status);
      }

      return (await response.json()) as ApiResponseFeeEstimate;
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Failed to fetch fee estimate. ${error}`);
  }
};
