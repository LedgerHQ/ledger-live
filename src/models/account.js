//@flow
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import { createDataModel } from "../DataModel";
import type { DataModel } from "../DataModel";
import type { Account, AccountRaw } from "../types";

const MAX_OP_SIZE_TO_KEEP = 100;

/**
 */
const accountModel: DataModel<AccountRaw, Account> = createDataModel({
  migrations: [
    // Each time a modification is brought to the model, add here a migration function
  ],

  wrap: ({
    coinType,
    unitMagnitude,
    operations,
    ...acc
  }: AccountRaw): Account => {
    const currency = getCurrencyByCoinType(coinType);
    const unit =
      currency.units.find(u => u.magnitude === unitMagnitude) ||
      currency.units[0];
    return {
      ...acc,
      operations: operations.map(({ date, ...op }) => ({
        ...op,
        date: new Date(date)
      })),
      unit,
      currency
    };
  },

  unwrap: ({ currency, operations, unit, ...acc }: Account): AccountRaw => ({
    ...acc,
    operations: operations
      .slice(0, MAX_OP_SIZE_TO_KEEP)
      .map(({ date, ...op }) => ({
        ...op,
        date: date.toISOString()
      })),
    coinType: currency.coinType,
    unitMagnitude: unit.magnitude
  })
});

export default accountModel;
