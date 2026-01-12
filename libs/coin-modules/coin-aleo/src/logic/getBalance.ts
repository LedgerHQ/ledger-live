import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";
import { parseMicrocredits } from "./utils";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const microcreditsU64 = await apiClient.getAccountBalance(currency, address);

  if (!microcreditsU64) {
    return [];
  }

  const microcredits = parseMicrocredits(microcreditsU64);

  const balances: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(microcredits),
    },
  ];

  return balances;
}
