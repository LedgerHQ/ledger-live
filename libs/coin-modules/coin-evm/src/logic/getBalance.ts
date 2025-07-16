import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { EvmAsset } from "../types";

import { getNodeApi } from "../network/node";
import { getExplorerApi } from "../network/explorer";

/**
 * Get all assets linked to the user (native, tokens, ...)
 * @param currency - The currency we must get the balances of
 * @param address - The user's address
 * @returns Promise<Balance<EvmAsset>[]> - Array of balances for all assets (first element will always be the native asset)
 */
export async function getBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<Balance<EvmAsset>[]> {
  const balance: Balance<EvmAsset>[] = [];

  const nodeApi = getNodeApi(currency);
  const explorerApi = getExplorerApi(currency);

  // Get native balance for the first element array
  const nativeBalance = await nodeApi.getCoinBalance(currency, address);
  balance.push({
    value: BigInt(nativeBalance.toString()),
    asset: { type: "native" },
  });

  // Get user's token operations to get all his contract address for the next balance elements
  const { lastTokenOperations } = await explorerApi.getLastOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    0,
  );

  const contractAddresses = new Set<string>();
  for (const operation of lastTokenOperations) {
    if (operation.contract && !contractAddresses.has(operation.contract)) {
      const tokenBalance = await nodeApi.getTokenBalance(currency, address, operation.contract);
      const integerString = tokenBalance.toFixed(0);

      balance.push({
        value: BigInt(integerString),
        asset: {
          type: "token",
          contractAddress: operation.contract,
          standard: "erc",
        },
      });
      contractAddresses.add(operation.contract);
    }
  }

  return balance;
}

export default getBalance;
