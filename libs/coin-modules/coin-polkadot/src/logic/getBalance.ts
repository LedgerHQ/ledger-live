import { Balance } from "@ledgerhq/coin-framework/api/types";
import network from "../network";
// import { PolkadotAsset } from "../types";

export async function getBalance(addr: string): Promise<Balance[]> {
  const balances = await network.getBalances(addr);
  return [{ value: BigInt(balances.balance.toString()), asset: { assetType: "native" } }];
}
