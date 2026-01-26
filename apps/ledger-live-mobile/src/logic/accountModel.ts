import { createDataModel } from "@ledgerhq/live-common/DataModel";
import type { DataModel } from "@ledgerhq/live-common/DataModel";
import type { Account, AccountRaw, Operation, AccountUserData } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/index";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/store";

export const opRetentionFilter = (_op: Operation, index: number): boolean => index < 20;

const accountModel: DataModel<AccountRaw, [Account, AccountUserData]> = createDataModel({
  migrations: [],
  decode: async (raw: AccountRaw) => [await fromAccountRaw(raw), accountRawToAccountUserData(raw)],
  encode: ([account, userData]: [Account, AccountUserData]): AccountRaw =>
    toAccountRaw(
      {
        ...account,
        operations: account.operations.filter(opRetentionFilter),
        subAccounts: account.subAccounts?.map(subAccount => ({
          ...subAccount,
          operations: subAccount.operations.filter(opRetentionFilter),
        })),
      },
      userData,
    ),
});

export default accountModel;
