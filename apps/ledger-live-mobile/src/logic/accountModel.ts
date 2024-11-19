import { createDataModel } from "@ledgerhq/live-common/DataModel";
import type { DataModel } from "@ledgerhq/live-common/DataModel";
import type { Account, AccountRaw, Operation, AccountUserData } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/index";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/store";

/**
 * @memberof models/account
 */
export const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.valueOf() < 1000 * 60 * 60 * 24 * maxDaysOld;

const opRetentionFilter = opRetentionStategy(366, 500);

const accountModel: DataModel<AccountRaw, [Account, AccountUserData]> = createDataModel({
  migrations: [],
  decode: (raw: AccountRaw) => [fromAccountRaw(raw), accountRawToAccountUserData(raw)],
  encode: ([account, userData]: [Account, AccountUserData]): AccountRaw =>
    toAccountRaw(
      {
        ...account,
        operations: account.operations.filter(opRetentionFilter),
      },
      userData,
    ),
});

export default accountModel;
