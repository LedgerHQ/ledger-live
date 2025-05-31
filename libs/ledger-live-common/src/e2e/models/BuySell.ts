import { AccountType } from "../enum/Account";

export interface Fiat {
  locale: string;
  currencyTicker: string;
}

export interface BuySell {
  crypto: AccountType;
  fiat: Fiat;
  amount: string;
}
