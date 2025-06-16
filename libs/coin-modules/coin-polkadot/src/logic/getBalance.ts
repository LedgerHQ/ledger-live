import { Balance } from "@ledgerhq/coin-framework/api/types";
import network from "../network";
import { PolkadotAsset } from "../types";

export async function getBalance(addr: string): Promise<Balance<PolkadotAsset>[]> {
  const balances = await network.getBalances(addr);
  return [{ value: BigInt(balances.balance.toString()), asset: { type: "native" } }];
}
