import { log } from "@ledgerhq/logs";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { ZCASH_LOG_TYPE, getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";

/**
 * The transparent outpoints a signed transaction spends, and the source that
 * knows whether they are still unspent.
 *
 * Passed in rather than resolved here because only the caller has them: the
 * outpoints come from the operation the signing produced, and the explorer from
 * the account's wallet-btc handle -- both `bridge/` material, which `logic/`
 * must not reach into. A caller holding a bare transaction hex (the headless
 * api) has nothing to check with: recovering the prevouts would mean decoding
 * the V5 bytes, which only the native engine can do.
 */
export type TransparentInputs = {
  inputRefs: { hash: string; outputIndex: number }[];
  fetchUtxoTx: (
    hash: string,
  ) => Promise<{ outputs: { output_index: number; spent_at_height?: number | null }[] }>;
};

/**
 * Refuses a transaction whose transparent inputs are already confirmed-spent.
 *
 * Nothing else catches this: the signed V5 transaction goes out over gRPC, and
 * the wallet's own view of its UTXOs can be stale -- a spend made from another
 * device, or a previous attempt that landed after this one was built. The
 * explorer is the only source that knows.
 *
 * A transaction whose source cannot be fetched is refused too: the value spent
 * is unverifiable, and submitting on a failed lookup is the outcome this guard
 * exists to prevent.
 */
export async function assertTransparentInputsUnspent({
  inputRefs,
  fetchUtxoTx,
}: TransparentInputs): Promise<void> {
  const uniqueHashes = new Set(inputRefs.map(r => r.hash));

  for (const txHash of uniqueHashes) {
    const tx = await fetchUtxoTx(txHash).catch(() => {
      log(ZCASH_LOG_TYPE, "broadcast guard: source transaction not found", { hash: txHash });
      throw new InvalidTransactionError("tx not found");
    });

    for (const ref of inputRefs.filter(r => r.hash === txHash)) {
      const output = tx.outputs.find(o => o.output_index === ref.outputIndex);
      if (output && typeof output.spent_at_height === "number" && output.spent_at_height > 0) {
        log(ZCASH_LOG_TYPE, "broadcast guard: refusing already-spent transparent input", {
          hash: ref.hash,
          outputIndex: ref.outputIndex,
        });
        throw new InvalidTransactionError("utxos already spent");
      }
    }
  }
}

/**
 * Broadcasts a signed V5 transaction over the Zaino gRPC endpoint. Every Zcash
 * send (including t→t) goes through this path -- coin-zcash never falls back to
 * the standard explorer broadcast.
 *
 * `transparentInputs` enables the double-spend guard above; a transaction that
 * spends no transparent outpoint (fully shielded) has nothing to guard.
 */
export async function broadcast(
  txHex: string,
  transparentInputs?: TransparentInputs,
): Promise<string> {
  if (transparentInputs && transparentInputs.inputRefs.length > 0) {
    await assertTransparentInputsUnspent(transparentInputs);
  }

  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });

  if (!client.broadcastTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  const sizeBytes = txHex.length / 2;
  log(ZCASH_LOG_TYPE, "broadcasting transaction", { endpoint: grpcUrl, sizeBytes });
  const startedAt = Date.now();

  try {
    const txid = await client.broadcastTransaction(grpcUrl, txHex);
    log(ZCASH_LOG_TYPE, "broadcast succeeded", {
      endpoint: grpcUrl,
      txid,
      durationMs: Date.now() - startedAt,
    });
    return txid;
  } catch (error) {
    log(ZCASH_LOG_TYPE, "broadcast failed", {
      endpoint: grpcUrl,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
