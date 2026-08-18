import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { fetchAccountStateInfo, fetchBalance } from "../network/api";
import type { CasperContext } from "../types/config";

export async function getBalance(context: CasperContext, address: string): Promise<Balance[]> {
  const config = await context.config();
  const { purseUref } = await fetchAccountStateInfo(config, address);

  if (!purseUref) {
    return [{ value: 0n, asset: { type: "native" } }];
  }

  const balance = await fetchBalance(config, purseUref);

  return [{ value: BigInt(balance.toFixed(0)), asset: { type: "native" } }];
}
