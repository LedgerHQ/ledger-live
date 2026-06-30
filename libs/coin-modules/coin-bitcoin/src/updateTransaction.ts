import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { Transaction } from "./types";
import type { ZcashTransaction } from "./chain-adapters/zcash/types";
import { classifyZcashRecipient, deriveZcashTransferType } from "./chain-adapters/zcash/address";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  const updatedT = defaultUpdateTransaction(tx, patch);

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  // Zcash shielded context: classify recipient and derive transferType.
  // Gated on "sender" in tx — this field is set only by the flag-gated
  // UI-01 selector (ZcashTransferFromSelector), keeping flag-off and
  // non-shielded paths identical to before.
  if ("sender" in updatedT) {
    const zt = updatedT as ZcashTransaction;
    const cls = zt.recipient ? classifyZcashRecipient(zt.recipient) : undefined;
    const recipientType = cls && "recipientType" in cls ? cls.recipientType : undefined;
    if (recipientType !== undefined) {
      zt.recipientType = recipientType;
    } else {
      delete zt.recipientType;
    }
    zt.transferType = deriveZcashTransferType(zt.sender, recipientType);
  }

  return updatedT;
};

export default updateTransaction;
