/**
 * @module models/account
 * @flow
 */
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import { createDataModel } from "../DataModel";
import type { DataModel } from "../DataModel";
import type { Account, AccountRaw, Operation } from "../types";

/**
 * @memberof models/account
 */
export const opRetentionStategy = (maxDaysOld: number, keepFirst: number) => (
  op: Operation,
  index: number
): boolean =>
  index < keepFirst || Date.now() - op.date < 1000 * 60 * 60 * 24 * maxDaysOld;

/**
 * @memberof models/account
 * @example
 * import { createAccountModel } from "@ledgerhq/wallet-common/lib/models/account";
 * const AccountModel = createAccountModel();
 * const raw = AccountModel.encode(account);
 * const decoded = AccountModel.decode(raw);
 */
export const createAccountModel = (
  opRetentionFilter: (
    op: Operation,
    index: number
  ) => boolean = opRetentionStategy(366, 100)
): DataModel<AccountRaw, Account> =>
  createDataModel({
    migrations: [
      // Each time a modification is brought to the model, add here a migration function
    ],

    decode: (rawAccount: AccountRaw): Account => {
      const {
        coinType,
        unitMagnitude,
        operations,
        lastSyncDate,
        ...acc
      } = rawAccount;
      const currency = getCurrencyByCoinType(coinType);
      const unit =
        currency.units.find(u => u.magnitude === unitMagnitude) ||
        currency.units[0];
      return {
        ...acc,
        coinType,
        operations: operations.map(({ date, ...op }) => ({
          ...op,
          accountId: acc.id,
          date: new Date(date)
        })),
        unit,
        currency,
        lastSyncDate: new Date(lastSyncDate)
      };
    },

    encode: ({
      currency,
      operations,
      unit,
      lastSyncDate,
      ...acc
    }: Account): AccountRaw => {
      return {
        ...acc,
        operations: operations
          .filter(opRetentionFilter)
          .map(({ date, ...op }) => {
            return {
              ...op,
              date: date.toISOString()
            };
          }),
        coinType: currency.coinType,
        unitMagnitude: unit.magnitude,
        lastSyncDate: lastSyncDate.toISOString()
      };
    }
  });
