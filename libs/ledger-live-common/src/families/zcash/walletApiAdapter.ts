import type { BitcoinTransaction as WalletAPIBitcoinTransaction } from "@ledgerhq/wallet-api-core";
import type { AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "@ledgerhq/coin-zcash/bridge/createTransaction";
import type { Transaction } from "@ledgerhq/coin-zcash/types/bridge";

/**
 * A live app sees Zcash as a bitcoin-family currency, so it sends a Wallet API bitcoin
 * transaction. coin-zcash serves the account: the request becomes a transparent Zcash
 * send, whose fee ZIP-317 fixes, so a fee the app passes is not used and cannot be edited.
 *
 * Typed on its own rather than with `GetWalletAPITransactionSignFlowInfos`: the Zcash
 * transaction is not part of the shared `Transaction` union that type is bound to.
 */
function getWalletAPITransactionSignFlowInfos({
  walletApiTransaction,
  account,
}: {
  walletApiTransaction: WalletAPIBitcoinTransaction;
  account: AccountLike;
}): { canEditFees: boolean; hasFeesProvided: boolean; liveTx: Partial<Transaction> } {
  const liveTx: Transaction = createTransaction(account);

  if (walletApiTransaction.amount) {
    liveTx.amount = walletApiTransaction.amount;
  }

  if (walletApiTransaction.recipient) {
    liveTx.recipient = walletApiTransaction.recipient;
  }

  return { canEditFees: false, liveTx, hasFeesProvided: false };
}

export default { getWalletAPITransactionSignFlowInfos };
