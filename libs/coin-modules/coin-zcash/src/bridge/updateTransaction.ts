import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types/bridge";
import { classifyZcashRecipient, deriveZcashTransferType } from "../logic/address";

/**
 * Classifies the recipient and re-derives `transferType` on every patch, so
 * transferType always reflects the current (sender, recipient) pair -- see
 * logic/address.ts `deriveZcashTransferType`.
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

  return updated;
};
