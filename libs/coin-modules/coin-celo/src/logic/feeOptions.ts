import type { FeeOptionMeta } from "@ledgerhq/coin-module-framework/api/index";
import type { BigNumber } from "bignumber.js";
import { FEE_CURRENCY_BY_CONTRACT, FEE_CURRENCY_OPTIONS } from "../constants";

/** Native CELO gas, the framework default when no fee option is selected. */
export const STANDARD_FEE_OPTION_ID = "standard";

export type HeldToken = { contractAddress: string; balance: bigint | BigNumber };

const isPositive = (balance: bigint | BigNumber): boolean =>
  typeof balance === "bigint" ? balance > 0n : balance.gt(0);

/**
 * Fee-payment options for Celo: native CELO plus every held, allowlisted fee token. A token option's
 * id is its lowercased contract address, so it does not depend on any account.
 */
export function getFeeOptions(heldTokens: readonly HeldToken[]): FeeOptionMeta[] {
  const options: FeeOptionMeta[] = [
    {
      id: STANDARD_FEE_OPTION_ID,
      feeAsset: { type: "native", name: FEE_CURRENCY_OPTIONS[0].name },
    },
  ];
  const seen = new Set<string>();
  for (const { contractAddress, balance } of heldTokens) {
    const id = contractAddress.toLowerCase();
    const feeCurrency = FEE_CURRENCY_BY_CONTRACT.get(id);
    if (!feeCurrency || !isPositive(balance) || seen.has(id)) continue;
    seen.add(id);
    options.push({
      id,
      feeAsset: { type: "erc20", assetReference: contractAddress, name: feeCurrency.name },
    });
  }
  return options;
}

/** The CIP-64 `feeCurrency` (adapter address) for a token option id; undefined (pay in CELO) for standard or unknown ids. */
export function feeCurrencyForOption(feeOptionId: string): `0x${string}` | undefined {
  return FEE_CURRENCY_BY_CONTRACT.get(feeOptionId.toLowerCase())?.adapterAddress ?? undefined;
}
