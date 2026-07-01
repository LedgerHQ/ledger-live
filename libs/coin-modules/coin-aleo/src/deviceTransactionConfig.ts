import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { TRANSACTION_TYPE } from "./constants";
import type { Transaction, TransactionType, TransactionStatus } from "./types";

const mapTransactionModeToMethod: Record<TransactionType, string> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: "Transfer Public",
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: "Transfer Private",
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: "Shield",
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: "Unshield",
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: "Transfer Token Public",
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: "Transfer Token Private",
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: "Token Shield",
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: "Token Unshield",
  [TRANSACTION_TYPE.BOND_PUBLIC]: "Bond Public",
  [TRANSACTION_TYPE.UNBOND_PUBLIC]: "Unbond Public",
  [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: "Claim Unbond Public",
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

  fields.push(
    { type: "text", label: "Method", value: method },
    { type: "address", label: "From", address: mainAccount.freshAddress },
    { type: "address", label: "To", address: transaction.recipient },
    { type: "amount", label: "Amount" },
  );

  // TODO: restore config.isFeeSponsored check
  // https://ledgerhq.atlassian.net/browse/LIVE-29092
  if (status.estimatedFees.isZero()) {
    fields.push({
      type: "text",
      label: "Fees",
      value: "Sponsored by Provable",
      valueI18nKey: "aleo.shared.sponsoredByProvable",
    });
  } else {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
