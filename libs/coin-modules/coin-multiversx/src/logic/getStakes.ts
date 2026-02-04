import type { Page, Stake } from "@ledgerhq/coin-framework/api/types";

import MultiversXApi from "../api/apiCalls";
import { isValidAddress } from "../logic";
import { mapToStake } from "./mappers";

/**
 * Fetch delegation positions (stakes) for a MultiversX address.
 * @param apiClient - MultiversX API client instance
 * @param address - The MultiversX address to query delegations for
 * @returns Page containing Stake objects (no pagination from API)
 * @throws Error with descriptive message if address is invalid or network fails
 */
export async function getStakes(apiClient: MultiversXApi, address: string): Promise<Page<Stake>> {
  // Validate address format
  if (!isValidAddress(address)) {
    throw new Error(`Invalid MultiversX address: ${address}`);
  }

  try {
    // Fetch delegations from API
    const delegations = await apiClient.getAccountDelegations(address);

    // Map each delegation to Stake object
    const stakes = delegations.map(delegation => mapToStake(delegation, address));

    // Return Page structure (no pagination from MultiversX delegation API)
    return {
      items: stakes,
      next: undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch delegations for ${address}: ${message}`);
  }
}
