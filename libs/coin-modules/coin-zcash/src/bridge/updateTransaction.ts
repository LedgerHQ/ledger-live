import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types/bridge";
import { classifyZcashRecipient, deriveZcashTransferType } from "../logic/address";

/**
 * Classifies the recipient and re-derives `transferType` on every patch, so
 * transferType always reflects the current (sender, recipient) pair -- see
 * logic/address.ts `deriveZcashTransferType`.
 *
 * The memo is dropped on the same pass whenever the recipient is not shielded: only
 * a shielded output carries one, so a memo left over from an earlier shielded
 * recipient must not survive a switch to a transparent address and reach the builder
 * (`mapOutputs` attaches whatever memo the transaction holds).
 */
export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  const updated = defaultUpdateTransaction(tx, patch);

  const cls = updated.recipient ? classifyZcashRecipient(updated.recipient) : undefined;
  const recipientType = cls && "recipientType" in cls ? cls.recipientType : undefined;
  if (recipientType !== undefined) {
    updated.recipientType = recipientType;
  } else {
    delete updated.recipientType;
  }
  updated.transferType = deriveZcashTransferType(updated.sender, recipientType);

  if (recipientType !== "private") {
    delete updated.memo;
  }

  return updated;
};
