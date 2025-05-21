import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";
import { StellarAsset } from "../types";

export async function getBalance(addr: string): Promise<Balance<StellarAsset>[]> {
  const { balance } = await fetchAccount(addr);
  return [{ value: BigInt(balance.toString()), asset: { type: "native" } }];
}
