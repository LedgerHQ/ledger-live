import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { fetchAccountStateInfo, fetchBalance } from "../network/api";

export async function getBalance(address: string): Promise<Balance[]> {
  const { purseUref } = await fetchAccountStateInfo(address);

  if (!purseUref) {
    return [{ value: 0n, asset: { type: "native" } }];
  }

  const balance = await fetchBalance(purseUref);

  return [{ value: BigInt(balance.toFixed(0)), asset: { type: "native" } }];
}
