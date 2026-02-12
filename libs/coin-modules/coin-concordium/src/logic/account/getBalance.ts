import { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountBalance } from "../../network/proxyClient";

export async function getBalance(address: string, currency: CryptoCurrency): Promise<Balance[]> {
  const balanceResponse = await getAccountBalance(currency, address);
  return [
    { asset: { type: "native" }, value: BigInt(balanceResponse.finalizedBalance.accountAmount) },
  ];
}
