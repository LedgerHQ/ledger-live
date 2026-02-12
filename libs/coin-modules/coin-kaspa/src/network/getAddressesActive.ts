import { ApiResponseAddressActive } from "../types";
import { API_BASE } from "./config";

export const getAddressesActive = async (
  addresses: string[],
): Promise<ApiResponseAddressActive[]> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/active`, {
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
