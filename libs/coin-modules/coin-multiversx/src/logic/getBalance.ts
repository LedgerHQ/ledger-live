import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type MultiversXApiClient from "../api/apiCalls";
import { isValidAddress } from "../logic";
import { mapToBalance, mapToEsdtBalance } from "./mappers";

/**
 * Retrieves native EGLD balance and all ESDT token balances for a MultiversX address.
 * @param api - MultiversX API client
 * @param address - MultiversX address (erd1...)
 * @returns Array with native balance first, followed by ESDT token balances (CRITICAL: never empty per FR4)
 * @throws Error with descriptive message if address is invalid or network fails
 */
export async function getBalance(api: MultiversXApiClient, address: string): Promise<Balance[]> {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid MultiversX address: ${address}`);
  }

  try {
    const balances: Balance[] = [];

    // Fetch native EGLD balance - ALWAYS include even if 0 (FR4 compliance)
    const { balance } = await api.getAccountDetails(address);
    balances.push(mapToBalance(balance));

    // Fetch ESDT token balances (Story 1.3 - FR2)
    const tokens = await api.getESDTTokensForAddress(address);
    for (const token of tokens) {
      balances.push(mapToEsdtBalance(token));
    }

    return balances;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch account ${address}: ${message}`);
  }
}
