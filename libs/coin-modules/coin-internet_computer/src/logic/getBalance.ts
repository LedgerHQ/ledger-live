import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/index";
import { queryBalance } from "../network/api";

export const NATIVE_ASSET: AssetInfo = { type: "native" };

/** The account's liquid ICP. Neuron stakes are held in governance subaccounts, not here. */
export async function getBalance(address: string): Promise<Balance[]> {
  const value = await queryBalance(address);
  if (value === undefined) throw new Error("[ICP](getBalance) Balance query failed");
  return [{ value, asset: NATIVE_ASSET }];
}
