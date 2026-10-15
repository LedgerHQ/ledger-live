import type { AccountBridge } from "@ledgerhq/types-live";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import wallet from "@ledgerhq/wallet-btc/index";
import { getWalletAccount } from "./getWalletAccount";
import { Transaction, BtcOperationExtra } from "./types";
/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
  broadcastConfig,
}) => {
  const { signature, operation } = signedOperation;
  const walletAccount = getWalletAccount(account);
  const extra = operation.extra as BtcOperationExtra | undefined;
  const inputRefs = extra?.inputRefs ?? [];

  // Double-spend guard, a no-op when the operation carries no input references.
  if (inputRefs.length > 0) {
    // Check each UTXO we're about to spend by fetching its source tx.
    // If the relevant output already has spent_at_height > 0 it has been
    // confirmed-spent by another transaction → double-spend → abort.
    const uniqueHashes = new Set(inputRefs.map(r => r.hash));
    for (const txHash of uniqueHashes) {
      const tx = await walletAccount.xpub.explorer.fetchUtxoTx(txHash).catch(() => {
        throw new InvalidTransactionError("tx not found");
      });
      const refsForHash = inputRefs.filter(r => r.hash === txHash);

      for (const ref of refsForHash) {
        const output = tx.outputs.find(o => o.output_index === ref.outputIndex);
        if (output && typeof output.spent_at_height === "number" && output.spent_at_height > 0) {
          throw new InvalidTransactionError("utxos already spent");
        }
      }
    }
  }

  const hash = await wallet.broadcastTx(walletAccount, signature, broadcastConfig);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
