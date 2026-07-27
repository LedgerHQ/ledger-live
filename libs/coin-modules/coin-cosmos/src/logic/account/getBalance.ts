import { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";

/** Single-asset (native gas token) — returns one native {@link Balance}, no token balances. */
export async function getBalance(api: CosmosAPI, address: string): Promise<Balance[]> {
  const currency = api.getCurrency();
  const amount = await api.getAllBalances(address, currency);

  return [
    {
      value: BigInt(amount.toFixed()),
      asset: { type: "native" },
    },
  ];
}
