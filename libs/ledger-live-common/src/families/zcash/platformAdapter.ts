// TODO: to remove once live-app-sdk is depreciated and removed from LL

import type { BitcoinTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import type { AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "@ledgerhq/coin-zcash/bridge/createTransaction";
import type { Transaction } from "@ledgerhq/coin-zcash/types/bridge";

/**
 * A live app on the live-app-sdk sees Zcash as a bitcoin-family currency, so it sends a
 * bitcoin transaction. coin-zcash serves the account: the request becomes a transparent
 * Zcash send, whose fee ZIP-317 fixes, so a fee the app passes is not used and cannot be
 * edited.
 */
const getPlatformTransactionSignFlowInfos = (
  tx: PlatformTransaction,
  account: AccountLike,
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  const liveTx: Transaction = createTransaction(account);

  if (tx.amount) {
    liveTx.amount = tx.amount;
  }

  if (tx.recipient) {
    liveTx.recipient = tx.recipient;
  }

  return { canEditFees: false, liveTx, hasFeesProvided: false };
};

export default { getPlatformTransactionSignFlowInfos };
