import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { getMainAccount } from "../../account";
import {
  getTransactionStakeAccount,
  getTransactionTransferFee,
  getTransactionValidator,
  isTokenTransferTransaction,
  isTransferTransaction,
} from "./transactions";

export type ExtraDeviceTransactionField = {
  type: "solana.token.transferFee";
  label: string;
};

type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];

  if (isTransferTransaction(transaction)) {
    if (!isTokenTransferTransaction(transaction)) {
      fields.push({ type: "amount", label: "Transfer" });
      return fields;
    }

    fields.push({ type: "amount", label: "Transfer tokens" });
    const transferFee = getTransactionTransferFee(transaction);
    if (transferFee && transferFee.feeBps > 0) {
      fields.push({ type: "solana.token.transferFee", label: "Transfer fee" });
    }
    fields.push({ type: "text", value: "Solana", label: "Network" });
    fields.push({ type: "fees", label: "Max network fees" });
    return fields;
  }

  const stakeAccount = getTransactionStakeAccount(transaction);
  const voteAccount = getTransactionValidator(transaction);

  switch (transaction.mode) {
    case "stake":
      fields.push({ type: "amount", label: "Deposit" });
      fields.push({
        type: "address",
        label: "New authority",
        address: getMainAccount(account, parentAccount).freshAddress,
      });
      break;
    case "delegate":
      break;
    case "undelegate":
      if (stakeAccount) {
        fields.push({ type: "address", label: "Deactivate stake", address: stakeAccount });
      }
      break;
    case "unstake":
      fields.push({ type: "amount", label: "Stake withdraw" });
      break;
  }

  if (stakeAccount && transaction.mode !== "undelegate") {
    fields.push({
      type: "address",
      label: transaction.mode === "unstake" ? "From" : "Delegate from",
      address: stakeAccount,
    });
  }
  if (voteAccount) {
    fields.push({ type: "address", label: "Vote account", address: voteAccount });
  }

  return fields;
}

export default getDeviceTransactionConfig;
