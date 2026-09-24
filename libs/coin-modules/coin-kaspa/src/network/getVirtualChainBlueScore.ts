import type { KaspaCoinConfig } from "../config";
import { getApiBase } from "./config";

export const getVirtualChainBlueScore = async (config: KaspaCoinConfig): Promise<number> => {
  try {
    const response = await fetch(`${getApiBase(config)}/info/virtual-chain-blue-score`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch virtual-chain-blue-score. Status: ${response.status}`);
    }

    return (await response.json()).blueScore as number;
  } catch (error) {
    throw new Error(`Error fetching virtual chain blue score: ${(error as Error).message}`);
  }
};
