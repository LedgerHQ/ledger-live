import { API_BASE } from "./config";
import { ApiResponseFeeEstimate } from "../types";

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
    console.error("Failed to fetch fee estimate:", error);
    throw error;
  }
};
