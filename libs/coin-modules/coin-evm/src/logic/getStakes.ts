import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Stake } from "@ledgerhq/coin-framework/lib/api/types";
import { getNodeApi } from "../network/node";

/**
 * Get staking positions for a given address
 * @param currency - The currency we must get the stakes of
 * @param address - The user's address
 * @returns Promise<Stake[]> - Array of staking positions
 */
export async function getStakes(currency: CryptoCurrency, address: string): Promise<Stake[]> {
  const nodeApi = getNodeApi(currency);

  try {
    const balance = await nodeApi.getCoinBalance(currency, address);

    if (balance.isZero()) {
      return [];
    }

    return [
      {
        uid: address,
        address,
        state: "active",
        asset: { type: "native" },
        amount: BigInt(balance.toFixed(0)),
      },
    ];
  } catch {
    return [];
  }
}
