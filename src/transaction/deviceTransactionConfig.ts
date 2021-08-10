import perFamily from "../generated/deviceTransactionConfig";
import type { ExtraDeviceTransactionField } from "../generated/deviceTransactionConfig";
import type {
  Transaction,
  TransactionStatus,
  Account,
  AccountLike,
} from "../types";
import { getMainAccount } from "../account";
type tooltipArgs = Record<string, string>;
export type CommonDeviceTransactionField =
  | {
      type: "amount";
      label: string;
    }
  | {
      type: "address";
      label: string;
      address: string;
    }
  | {
      type: "fees";
      label: string;
    }
  | {
      type: "text";
      label: string;
      value: string;
      tooltipI18nKey?: string;
      tooltipI18nArgs?: tooltipArgs;
    };
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
