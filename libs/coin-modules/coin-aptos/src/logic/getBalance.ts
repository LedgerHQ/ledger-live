import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import type { AptosAPI } from "../network";

export async function getBalance(
  aptosClient: AptosAPI,
  address: string,
): Promise<Balance<AptosAsset>[]> {
  const balance = await aptosClient.getBalances(address);

  return balance.map(x => ({
    value: BigInt(x.amount.toString()),
    asset: { type: "native" },
  }));
}
