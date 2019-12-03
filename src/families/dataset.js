// @flow

import type {
  CryptoCurrencyIds,
  Account,
  AccountRaw,
  Transaction,
  TransactionStatus,
  AccountBridge,
  CurrencyBridge
} from "../types";

type ExpectFn = Function;

export type CurrenciesData<T: Transaction> = {|
  accounts: Array<{|
    raw: AccountRaw,
    transactions?: Array<{|
      name: string,
      transaction: T | ((T, Account, AccountBridge<T>) => T),
      expectedStatus?:
        | $Shape<TransactionStatus>
        | ((Account, T, TransactionStatus) => $Shape<TransactionStatus>),
      test?: (ExpectFn, T, TransactionStatus, AccountBridge<T>) => any
    |}>,
    test?: (ExpectFn, Account, AccountBridge<T>) => any
  |}>,
  test?: (ExpectFn, CurrencyBridge) => any
|};

export type DatasetTest<T> = {|
  implementations: string[],
  currencies: {
    [_: CryptoCurrencyIds]: CurrenciesData<T>
  }
|};
