import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
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
    const { balance } = await api.getAccountDetails(address);
    balances.push(mapToBalance(balance.toString()));

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
