import invariant from "invariant";
import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const microcreditsU64 = await apiClient.getAccountBalance(currency, address);

  if (!microcreditsU64) {
    return [];
  }

  invariant(microcreditsU64.endsWith("u64"), `aleo: invalid balance format (${microcreditsU64})`);
  const microcredits = microcreditsU64.slice(0, -3);

  const balances: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(microcredits),
    },
  ];

  return balances;
}
