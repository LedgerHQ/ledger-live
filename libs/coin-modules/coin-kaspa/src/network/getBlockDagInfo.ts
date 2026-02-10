import { ApiResponseBlockDagInfo } from "../types";
import { API_BASE } from "./config";

export const getBlockDagInfo = async (): Promise<ApiResponseBlockDagInfo> => {
  try {
    const response = await fetch(`${API_BASE}/info/blockdag`, {
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
