import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoCoinConfig } from "../types";
import { apiClient } from "../network/api";
import { parseMicrocredits } from "./utils";

export async function getBalance(
  configOrCurrencyId: AleoCoinConfig | string,
  address: string,
): Promise<Balance[]> {
  const microcreditsU64 = await apiClient.getAccountBalance(configOrCurrencyId, address);

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
