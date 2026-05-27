import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBalances } from "../api/api";

export async function getBalance(address: string): Promise<Balance[]> {
  const response = await fetchBalances(address);

  return [
    {
      value: BigInt(response.total_balance),
      asset: { type: "native" },
      locked: BigInt(response.locked_balance),
    },
  ];
}
