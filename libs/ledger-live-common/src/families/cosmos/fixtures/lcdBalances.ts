import type { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import BigNumber from "bignumber.js";
import { getCurrencyConfiguration } from "../../../config";

type Coin = { denom: string; amount: string };
type BankBalances = { balances: Coin[] };
type Delegations = { delegation_responses: { balance: Coin }[] };
type Unbondings = { unbonding_responses: { entries: { balance: string }[] }[] };

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  return response.json();
};

const total = (amounts: string[]): BigNumber =>
  amounts.reduce((sum, amount) => sum.plus(amount), new BigNumber(0));

export const readLcdBalances = async (currencyId: string, address: string) => {
  const { lcd, denom } = getCurrencyConfiguration<CosmosCoinConfig>(currencyId);
  const [bank, delegations, unbondings] = await Promise.all([
    getJson<BankBalances>(`${lcd}/cosmos/bank/v1beta1/balances/${address}`),
    getJson<Delegations>(`${lcd}/cosmos/staking/v1beta1/delegations/${address}`),
    getJson<Unbondings>(
      `${lcd}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`,
    ),
  ]);
  const liquid = total(bank.balances.filter(coin => coin.denom === denom).map(coin => coin.amount));
  const delegated = total(
    delegations.delegation_responses
      .filter(response => response.balance.denom === denom)
      .map(response => response.balance.amount),
  );
  const unbonding = total(
    unbondings.unbonding_responses.flatMap(response =>
      response.entries.map(entry => entry.balance),
    ),
  );
  return { balance: liquid.plus(delegated).plus(unbonding), spendableBalance: liquid };
};
