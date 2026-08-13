import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getAccount } from "../network";
import { computeMinimumBalance } from "./common";

/**
 * Get the balance of an Algorand account
 * @param context - The coin-module context (config + logger)
 * @param address - The account address
 * @returns Array of balances (native ALGO + ASA tokens)
 */
export async function getBalance(context: AlgorandContext, address: string): Promise<Balance[]> {
  const config = await context.config();
  const account = await getAccount(config, address);

  const nbAssets = account.assets.length;
  // min balance can be increased if user deployed apps, not supported yet
  const minimumBalance = computeMinimumBalance(nbAssets);

  const balances: Balance[] = [
    {
      value: BigInt(account.balance.toFixed()),
      asset: { type: "native" },
      locked: minimumBalance,
    },
  ];

  // Add ASA token balances
  for (const asset of account.assets) {
    balances.push({
      value: BigInt(asset.balance.toFixed()),
      asset: {
        type: "asa",
        assetReference: asset.assetId,
      },
    });
  }

  return balances;
}
