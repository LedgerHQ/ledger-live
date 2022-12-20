import Bridge from "../bridge/new";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/lib/transaction/common";
import type { Account, AccountLike, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";

export function getDeviceTransactionConfig(arg: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: TransactionCommon;
  status: TransactionStatusCommon;
}): Array<CommonDeviceTransactionField> {
  return Bridge.getInstance().getDeviceTransactionConfig(arg);
}
