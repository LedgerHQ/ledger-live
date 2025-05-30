import { Account } from "../enum/Account";

export interface Fiat {
  locale: string;
  currencyTicker: string;
}

export interface BuySell {
  crypto: Account;
  fiat: Fiat;
  amount: string;
}
