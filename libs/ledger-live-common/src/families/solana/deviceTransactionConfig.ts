import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
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

  // A transaction a partner already built describes itself; the intent's fields say nothing about
  // what the device will render, so claim nothing -- the legacy `kind: "raw"` branch returned [].
  if (transaction.raw) return fields;

  if (isTransferTransaction(transaction)) {
    if (!isTokenTransferTransaction(transaction)) {
      fields.push({ type: "amount", label: "Transfer" });
      return fields;
    }

    const transferFee = getTransactionTransferFee(transaction);
    fields.push(
      { type: "amount", label: "Transfer tokens" },
      ...(transferFee && transferFee.feeBps > 0
        ? ([{ type: "solana.token.transferFee", label: "Transfer fee" }] as const)
        : []),
      { type: "text", value: "Solana", label: "Network" },
      { type: "fees", label: "Max network fees" },
    );
    return fields;
  }

  const owner = getMainAccount(account, parentAccount).freshAddress;
  const tokenAccount = transaction.ownerTokenAccount;

  // The three commands only a live app submits. Ported from the legacy `fieldsForCreate*`, which
  // read the same addresses off the command descriptor.
  switch (transaction.mode) {
    case "opt-in":
      return [
        ...(tokenAccount
          ? ([{ type: "address", label: "Create token acct", address: tokenAccount }] as const)
          : []),
        { type: "address", label: "Owned by", address: owner },
        { type: "address", label: "Funded by", address: owner },
        { type: "address", label: "Fee payer", address: owner },
      ];
    case "approve":
      return [
        ...(tokenAccount
          ? ([{ type: "address", label: "Approve token account", address: tokenAccount }] as const)
          : []),
        { type: "address", label: "Owned by", address: owner },
        { type: "address", label: "Delegate to", address: transaction.recipient },
        { type: "amount", label: "Amount" },
      ];
    case "revoke":
      return [
        ...(tokenAccount
          ? ([{ type: "address", label: "Revoke token account", address: tokenAccount }] as const)
          : []),
        { type: "address", label: "Owned by", address: owner },
      ];
  }

  const stakeAccount = getTransactionStakeAccount(transaction);
  const voteAccount = getTransactionValidator(transaction);

  switch (transaction.mode) {
    case "stake":
      fields.push(
        // Not an `amount` field: the device shows the delegated amount plus the stake account's
        // rent, which is what actually leaves the wallet.
        {
          type: "text",
          label: "Deposit",
          value: formatCurrencyUnit(
            getMainAccount(account, parentAccount).currency.units[0],
            transaction.amount.plus(transaction.stakeAccountRent ?? 0),
            { disableRounding: true, showCode: true },
          ),
        },
        {
          type: "address",
          label: "New authority",
          address: owner,
        },
      );
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
    // "To" and "Seed" are missing: both come from a seed drawn at craft time, as for `stake`.
    case "split":
      fields.push(
        { type: "amount", label: "Split stake" },
        ...(stakeAccount
          ? ([{ type: "address", label: "From", address: stakeAccount }] as const)
          : []),
        { type: "address", label: "Base", address: owner },
        { type: "address", label: "Authorized by", address: owner },
        { type: "address", label: "Fee payer", address: owner },
      );
      return fields;
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
