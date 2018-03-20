//@flow
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import { createDataModel } from "../DataModel";
import type { DataModel } from "../DataModel";
import type { Account, AccountRaw } from "../types";

const model: DataModel<AccountRaw, Account> = createDataModel({
  version: 0,

  migrations: {
    [0]: a => a
  },

  wrap: ({ coinType, operations, ...acc }: AccountRaw): Account => ({
    ...acc,
    operations: operations.map(({ date, ...op }) => ({
      ...op,
      date: new Date(date)
    })),
    currency: getCurrencyByCoinType(coinType)
  }),

  unwrap: ({ currency, operations, ...acc }: Account): AccountRaw => ({
    ...acc,
    operations: operations.map(({ date, ...op }) => ({
      ...op,
      date: date.toISOString()
    })),
    coinType: currency.coinType
  })
});

export default model;
