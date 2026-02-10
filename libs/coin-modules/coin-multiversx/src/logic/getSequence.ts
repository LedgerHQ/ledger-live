import type MultiversXApiClient from "../api/apiCalls";
import { isValidAddress } from "../logic";

/**
 * Retrieves the account nonce (sequence) for a MultiversX address.
 * @param api - MultiversX API client
 * @param address - MultiversX address (erd1...)
 * @returns Account nonce as bigint (always >= 0n, 0n for new accounts)
 * @throws Error with descriptive message if address is invalid or network fails
 */
export async function getSequence(api: MultiversXApiClient, address: string): Promise<bigint> {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid MultiversX address: ${address}`);
  }

  try {
    const { nonce } = await api.getAccountDetails(address);

    // Validate nonce is a valid number before conversion
    if (nonce === null || nonce === undefined) {
      throw new Error(`Account nonce is null or undefined for address ${address}`);
    }

    if (typeof nonce !== "number") {
      throw new Error(`Account nonce is not a number (got ${typeof nonce}) for address ${address}`);
    }

    if (nonce < 0) {
      throw new Error(`Account nonce cannot be negative (got ${nonce}) for address ${address}`);
    }

    return BigInt(nonce);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch account ${address}: ${message}`);
  }
}
