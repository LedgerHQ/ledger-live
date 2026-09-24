import type { KaspaCoinConfig } from "../config";
import { ApiResponseBlockDagInfo } from "../types";
import { getApiBase } from "./config";

export const getBlockDagInfo = async (
  config: KaspaCoinConfig,
): Promise<ApiResponseBlockDagInfo> => {
  try {
    const response = await fetch(`${getApiBase(config)}/info/blockdag`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const blockDagInfo: ApiResponseBlockDagInfo = await response.json();
    return blockDagInfo;
  } catch (error) {
    throw new Error(`Failed to fetch BlockDAG info. Error: ${error}`);
  }
};
