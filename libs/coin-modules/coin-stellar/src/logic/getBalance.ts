import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";

export async function getBalance(addr: string): Promise<Balance[]> {
  const { balance } = await fetchAccount(addr);
  return [{ value: BigInt(balance.toString()), asset: { type: "native" } }];
}
