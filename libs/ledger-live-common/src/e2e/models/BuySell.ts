import { AccountType } from "../enum/Account";
import { OperationType } from "../enum/OperationType";

export interface Fiat {
  locale: string;
  currencyTicker: string;
}

export interface BuySell {
  crypto: AccountType;
  fiat: Fiat;
  amount: string;
  operation: OperationType;
}
