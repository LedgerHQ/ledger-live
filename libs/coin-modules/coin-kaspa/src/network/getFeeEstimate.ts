import { ApiResponseFeeEstimate } from "../types";
import { API_BASE } from "./config";

export const getFeeEstimate = async (): Promise<ApiResponseFeeEstimate> => {
  try {
    const response = await fetch(`${API_BASE}/info/fee-estimate`, {
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
