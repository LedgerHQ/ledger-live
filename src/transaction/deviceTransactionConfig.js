// @flow
import perFamily from "../generated/deviceTransactionConfig";
import type { ExtraDeviceTransactionField } from "../generated/deviceTransactionConfig";
import type {
  Transaction,
  TransactionStatus,
  Account,
  AccountLike,
} from "../types";
import { getMainAccount } from "../account";

export type CommonDeviceTransactionField =
  | { type: "amount", label: string, tooltipI18nKey?: string }
  | { type: "address", label: string, address: string, tooltipI18nKey?: string }
  | { type: "fees", label: string, tooltipI18nKey?: string }
  | { type: "text", label: string, value: string, tooltipI18nKey?: string };

export type DeviceTransactionField =
  | CommonDeviceTransactionField
  | ExtraDeviceTransactionField;

export function getDeviceTransactionConfig(arg: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(arg.account, arg.parentAccount);
  const f = perFamily[mainAccount.currency.family];
  if (!f) return [];
  return f(arg);
}
