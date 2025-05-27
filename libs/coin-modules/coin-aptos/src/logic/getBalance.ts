import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import type { AptosAPI } from "../network";
import { APTOS_ASSET_ID } from "../constants";

export async function getBalances(
  aptosClient: AptosAPI,
  address: string,
  contract_address?: string,
): Promise<Balance<AptosAsset>[]> {
  const balances = await aptosClient.getBalances(address, contract_address);

  return balances.map(balance => {
    const isNative = balance.asset_type === APTOS_ASSET_ID;

    return {
      value: BigInt(balance.amount.toString()),
      asset: isNative ? { type: "native" } : { type: "token", asset_type: balance.asset_type },
    };
  });
}
