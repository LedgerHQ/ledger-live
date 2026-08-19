import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getAccountBalance } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function getBalance(
  config: ConcordiumCoinConfig,
  address: string,
  currencyId: string,
): Promise<Balance[]> {
  const balanceResponse = await getAccountBalance(config, currencyId, address);
  return [
    { asset: { type: "native" }, value: BigInt(balanceResponse.finalizedBalance.accountAmount) },
  ];
}
