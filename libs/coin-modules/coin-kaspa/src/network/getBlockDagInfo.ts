import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseBlockDagInfo } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getBlockDagInfo = async (): Promise<ApiResponseBlockDagInfo> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/info/blockdag`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw httpError(`Status: ${response.status}`, response.status);
      }

      return (await response.json()) as ApiResponseBlockDagInfo;
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Failed to fetch BlockDAG info. Error: ${error}`);
  }
};
