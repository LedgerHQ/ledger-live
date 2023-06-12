import { createDataModel } from "@ledgerhq/live-common/DataModel";
import type { DataModel } from "@ledgerhq/live-common/DataModel";
import type { Account, AccountRaw, Operation } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/index";

/**
 * @memberof models/account
 */
export const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.valueOf() < 1000 * 60 * 60 * 24 * maxDaysOld;
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
