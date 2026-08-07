import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getAccountBalance } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getBalance(
  address: string,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<Balance[]> {
  const balanceResponse = await getAccountBalance(currencyId, address, config);
  return [
    { asset: { type: "native" }, value: BigInt(balanceResponse.finalizedBalance.accountAmount) },
  ];
}
