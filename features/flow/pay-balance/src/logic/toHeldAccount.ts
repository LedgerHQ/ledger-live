import type { HeldAccount } from "./buildStablecoinHoldings";

type HeldCurrencySource = Readonly<{
  id: string;
  name: string;
  ticker: string;
  units: readonly { name: string; code: string; magnitude: number }[];
}>;

type HeldAccountSource =
  | Readonly<{
      type: "Account";
      balance: { toNumber(): number };
      currency: HeldCurrencySource;
    }>
  | Readonly<{
      type: "TokenAccount";
      balance: { toNumber(): number };
      token: HeldCurrencySource;
    }>;

function accountCurrency(account: HeldAccountSource): HeldCurrencySource {
  return account.type === "Account" ? account.currency : account.token;
}

export function toHeldAccount(account: HeldAccountSource): HeldAccount {
  const currency = accountCurrency(account);
  return {
    type: account.type,
    balance: account.balance.toNumber(),
    currency: {
      id: currency.id,
      name: currency.name,
      ticker: currency.ticker,
      units: currency.units.map(unit => ({
        name: unit.name,
        code: unit.code,
        magnitude: unit.magnitude,
      })),
    },
  };
}
