import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoCoinConfig } from "../types";
import { apiClient } from "../network/api";
import { parseMicrocredits } from "./utils";

export async function getBalance(config: AleoCoinConfig, address: string): Promise<Balance[]> {
  const microcreditsU64 = await apiClient.getAccountBalance(config, address);

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
