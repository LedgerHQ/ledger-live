import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getAccount } from "../network";
import { computeMinimumBalance } from "./common";

/**
 * Get the balance of an Algorand account
 * @param address - The account address
 * @returns Array of balances (native ALGO + ASA tokens)
 */
export async function getBalance(address: string): Promise<Balance[]> {
  const account = await getAccount(address);

  const nbAssets = account.assets.length;
  // min balance can be increased if user deployed apps, not supported yet
  const minimumBalance = computeMinimumBalance(nbAssets);

  const balances: Balance[] = [
    {
      value: BigInt(account.balance.toString()),
      asset: { type: "native" },
      locked: minimumBalance,
    },
  ];

  // Add ASA token balances
  for (const asset of account.assets) {
    balances.push({
      value: BigInt(asset.balance.toString()),
      asset: {
        type: "asa",
        assetReference: asset.assetId,
      },
    });
  }

  return balances;
}
