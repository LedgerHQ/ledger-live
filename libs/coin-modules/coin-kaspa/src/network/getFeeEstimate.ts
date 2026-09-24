import type { KaspaCoinConfig } from "../config";
import { ApiResponseFeeEstimate } from "../types";
import { getApiBase } from "./config";

export const getFeeEstimate = async (config: KaspaCoinConfig): Promise<ApiResponseFeeEstimate> => {
  try {
    const response = await fetch(`${getApiBase(config)}/info/fee-estimate`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const fees: ApiResponseFeeEstimate = await response.json();
    return fees;
  } catch (error) {
    throw new Error(`Failed to fetch fee estimate. ${error}`);
  }
};
