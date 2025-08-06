import { Balance } from "@ledgerhq/coin-framework/api/types";
import network from "../network";

export async function getBalance(addr: string): Promise<Balance[]> {
  const balances = await network.getBalances(addr);
  return [{ value: BigInt(balances.balance.toString()), asset: { type: "native" } }]; // Assuming the API returns a balance object with balance and spendableBalance
}
