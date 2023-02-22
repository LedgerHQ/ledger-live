import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import perFamily from "../generated/deviceTransactionConfig";
import type { ExtraDeviceTransactionField } from "../generated/deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "../generated/types";
import { getMainAccount } from "../account";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export type DeviceTransactionField =
  | CommonDeviceTransactionField
  | ExtraDeviceTransactionField;
export function getDeviceTransactionConfig(arg: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(arg.account, arg.parentAccount);
  const f = perFamily[mainAccount.currency.family];
  if (!f) return [];
  return f(arg);
}
