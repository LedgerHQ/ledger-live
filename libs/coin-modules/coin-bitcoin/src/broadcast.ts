import type { AccountBridge } from "@ledgerhq/types-live";
import { InvalidTransactionError } from "@ledgerhq/errors";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import wallet, { getWalletAccount } from "./wallet-btc";
import { Transaction } from "./types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
type InputRef = { hash: string; outputIndex: number; address: string };

type UtxoTxOutput = {
  output_index: number;
  spent_at_height: number | null;
};

type UtxoTx = {
  outputs: UtxoTxOutput[];
};

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
  broadcastConfig,
}) => {
  const { signature, operation } = signedOperation;
  const walletAccount = getWalletAccount(account);
  const extra = operation.extra as Record<string, unknown> | undefined;
  const inputs = (extra?.inputs as InputRef[] | undefined) ?? [];

  if (inputs.length > 0) {
    // Check each UTXO we're about to spend by fetching its source tx.
    // If the relevant output already has spent_at_height > 0 it has been
    // confirmed-spent by another transaction → double-spend → abort.
    const uniqueHashes = new Set(inputs.map(i => i.hash));
    for (const txHash of uniqueHashes) {
      const tx = (await walletAccount.xpub.explorer.fetchUtxoTx(txHash)) as UtxoTx;
      const inputsForHash = inputs.filter(i => i.hash === txHash);

      for (const input of inputsForHash) {
        const output = tx.outputs.find(o => o.output_index === input.outputIndex);
        if (
          output &&
          output.spent_at_height !== undefined &&
          output.spent_at_height !== null &&
          output.spent_at_height > 0
        ) {
          throw new InvalidTransactionError("utxos already spent");
        }
      }
    }
  }

  const hash = await wallet.broadcastTx(walletAccount, signature, broadcastConfig);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
