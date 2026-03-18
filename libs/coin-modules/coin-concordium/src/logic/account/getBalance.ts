import type { Balance } from "@ledgerhq/coin-framework/api/types";
import { getAccountBalance } from "../../network/proxyClient";

export async function getBalance(address: string, currencyId: string): Promise<Balance[]> {
  const balanceResponse = await getAccountBalance(currencyId, address);
  return [
    { asset: { type: "native" }, value: BigInt(balanceResponse.finalizedBalance.accountAmount) },
  ];
}
