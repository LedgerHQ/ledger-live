/**
 * @module models/account
 * @flow
 */
import { getCryptoCurrencyById } from "../helpers/currencies";
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
        currencyId,
        unitMagnitude,
        operations,
        pendingOperations,
        lastSyncDate,
        ...acc
      } = rawAccount;
      const currency = getCryptoCurrencyById(currencyId);
      const unit =
        currency.units.find(u => u.magnitude === unitMagnitude) ||
        currency.units[0];

      const convertOperation = ({ date, ...op }) => ({
        ...op,
        accountId: acc.id,
        date: new Date(date)
      });
      return {
        ...acc,
        operations: operations.map(convertOperation),
        pendingOperations: pendingOperations.map(convertOperation),
        unit,
        currency,
        lastSyncDate: new Date(lastSyncDate)
      };
    },

    encode: ({
      currency,
      operations,
      pendingOperations,
      unit,
      lastSyncDate,
      ...acc
    }: Account): AccountRaw => {
      const convertOperation = ({ date, ...op }) => {
        return {
          ...op,
          date: date.toISOString()
        };
      };
      return {
        ...acc,
        operations: operations.filter(opRetentionFilter).map(convertOperation),
        pendingOperations: pendingOperations.map(convertOperation),
        currencyId: currency.id,
        unitMagnitude: unit.magnitude,
        lastSyncDate: lastSyncDate.toISOString()
      };
    }
  });
