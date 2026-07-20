import { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { CosmosAPI } from "../../network/Cosmos";

/** Single-asset (native gas token) — returns one native {@link Balance}, no token balances. */
export async function getBalance(
  api: CosmosAPI,
  address: string,
  currencyId: string,
): Promise<Balance[]> {
  const currency = getCryptoCurrencyById(currencyId);
  const amount = await api.getAllBalances(address, currency);

  return [
    {
      value: BigInt(amount.toFixed()),
      asset: { type: "native" },
    },
  ];
}
