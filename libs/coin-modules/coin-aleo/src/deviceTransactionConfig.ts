import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import aleoCoinConfig from "./config";
import { TRANSACTION_TYPE } from "./constants";
import type { Transaction, TransactionType, TransactionStatus } from "./types";

const mapTransactionModeToMethod: Record<TransactionType, string> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: "Transfer Public",
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: "Transfer Private",
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: "Shield",
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: "Unshield",
};

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status,
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const method = mapTransactionModeToMethod[transaction.mode] ?? "Unknown";
  const mainAccount = getMainAccount(account, parentAccount);
  const config = aleoCoinConfig.getCoinConfig(mainAccount.currency);

  fields.push({
    type: "text",
    label: "Method",
    value: method,
  });

  fields.push({
    type: "amount",
    label: "Amount",
  });

  if (config.isFeeSponsored) {
    fields.push({
      type: "text",
      label: "Fees",
      value: "Sponsored by Provable",
    });
  } else if (!status.estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
