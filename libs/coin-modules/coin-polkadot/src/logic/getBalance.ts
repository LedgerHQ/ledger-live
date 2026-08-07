import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { type PolkadotCoinConfig } from "../config";
import network from "../network";

export async function getBalance(config: PolkadotCoinConfig, addr: string): Promise<Balance[]> {
  const balances = await network.getBalances(config, addr);
  return [{ value: BigInt(balances.balance.toString()), asset: { type: "native" } }]; // Assuming the API returns a balance object with balance and spendableBalance
}
