import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoCoinConfig } from "../types";
import { apiClient } from "../network/api";
import { parseMicrocredits } from "./utils";

export async function getPublicBalance(
  config: AleoCoinConfig,
  address: string,
): Promise<{ balances: Balance[]; height: number }> {
  const { data: microcreditsU64, height } = await apiClient.getAccountBalance(config, address);

  if (!microcreditsU64) {
    return { balances: [], height };
  }

  const microcredits = parseMicrocredits(microcreditsU64);

  const balances: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(microcredits),
    },
  ];

  return { balances, height };
}
