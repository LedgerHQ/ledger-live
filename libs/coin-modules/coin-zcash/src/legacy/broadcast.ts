import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import wallet from "@ledgerhq/wallet-btc/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { BtcOperationExtra, Transaction, ZcashAccount } from "../types/bridge";
import { resolveWalletAccount } from "./buildTransaction";

/**
 * Broadcasts through the explorer. Before it does, each UTXO the operation spends
 * is checked against its source transaction: one already spent by a confirmed
 * transaction is a double spend, and is refused.
 */
export const buildLegacyBroadcast =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["broadcast"] =>
  async ({ account, signedOperation: { signature, operation }, broadcastConfig }) => {
    const walletAccount = await resolveWalletAccount(context, account);
    const inputRefs = (operation.extra as BtcOperationExtra | undefined)?.inputRefs ?? [];

    for (const txHash of new Set(inputRefs.map(ref => ref.hash))) {
      const tx = await walletAccount.xpub.explorer.fetchUtxoTx(txHash).catch(() => {
        throw new InvalidTransactionError("tx not found");
      });
      for (const ref of inputRefs.filter(r => r.hash === txHash)) {
        const output = tx.outputs.find(o => o.output_index === ref.outputIndex);
        if (output && typeof output.spent_at_height === "number" && output.spent_at_height > 0) {
          throw new InvalidTransactionError("utxos already spent");
        }
      }
    }

    const hash = await wallet.broadcastTx(walletAccount, signature, broadcastConfig);
    return patchOperationWithHash(operation, hash);
  };
