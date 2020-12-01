// @flow
import { createDataModel } from "@ledgerhq/live-common/lib/DataModel";
import type { DataModel } from "@ledgerhq/live-common/lib/DataModel";
import type {
  Account,
  AccountRaw,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import {
  fromAccountRaw,
  toAccountRaw,
} from "@ledgerhq/live-common/lib/account";

/**
 * @memberof models/account
 */
export const opRetentionStategy = (maxDaysOld: number, keepFirst: number) => (
  op: Operation,
  index: number,
): boolean =>
  index < keepFirst || Date.now() - op.date < 1000 * 60 * 60 * 24 * maxDaysOld;

const opRetentionFilter = opRetentionStategy(366, 500);

const accountModel: DataModel<AccountRaw, Account> = createDataModel({
  migrations: [],
  decode: fromAccountRaw,

  encode: (account: Account): AccountRaw =>
    toAccountRaw({
      ...account,
      operations: account.operations.filter(opRetentionFilter),
    }),
});

export default accountModel;
