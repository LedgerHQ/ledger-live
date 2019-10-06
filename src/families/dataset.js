// @flow

import type {
  CryptoCurrencyIds,
  AccountRaw,
  Transaction,
  TransactionStatus
} from "../types";

export type CurrenciesData = {|
  accounts: Array<{|
    raw: AccountRaw,
    transactions?: Array<{|
      name: string,
      transaction: Transaction,
      // introduce possibility to impl a test function: (expect, Account, TransactionStatus)=>void
      expectedStatus: $Shape<TransactionStatus>
    |}>
  |}>
|};

export type DatasetTest = {|
  implementations: string[],
  currencies: {
    [_: CryptoCurrencyIds]: CurrenciesData
  }
|};
