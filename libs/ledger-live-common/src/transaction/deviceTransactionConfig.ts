import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { loadDeviceTxConfigForFamily } from "../coin-modules/registry";
import type { Transaction, TransactionStatus } from "../coin-modules/transaction-types";
import { getMainAccount } from "../account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "@ledgerhq/coin-casper/bridge/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "@ledgerhq/coin-filecoin/bridge/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "@ledgerhq/coin-stacks/bridge/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";
import type { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "@ledgerhq/coin-tron/bridge/deviceTransactionConfig";

type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_polkadot
  | ExtraDeviceTransactionField_tron;

export type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

export async function getDeviceTransactionConfig(arg: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const mainAccount = getMainAccount(arg.account, arg.parentAccount);
  const family = mainAccount.currency.family;
  const f = await loadDeviceTxConfigForFamily(family);
  if (!f) return [];
  return await f(arg);
}
