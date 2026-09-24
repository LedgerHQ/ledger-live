import type { KaspaCoinConfig } from "../config";
import { ApiResponseAddressActive } from "../types";
import { getApiBase } from "./config";

export const getAddressesActive = async (
  config: KaspaCoinConfig,
  addresses: string[],
): Promise<ApiResponseAddressActive[]> => {
  try {
    const response = await fetch(`${getApiBase(config)}/addresses/active`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch active state for addresses ${addresses}. Status: ${response.status}`,
      );
    }

    return (await response.json()) as ApiResponseAddressActive[];
  } catch (error) {
    throw new Error(`Error fetching AddressesActives: ${(error as Error).message}`);
  }
};
