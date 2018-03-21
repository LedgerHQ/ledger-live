//@flow
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import { createDataModel } from "../DataModel";
import type { DataModel } from "../DataModel";
import type { Account, AccountRaw } from "../types";

/**
 */
const accountModel: DataModel<AccountRaw, Account> = createDataModel({
  version: 0,

  migrations: {
    [0]: a => a
    // last migration function should return an AccountRaw
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

export default accountModel;
