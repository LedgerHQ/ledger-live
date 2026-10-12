import { Transaction } from "bitcoinjs-lib";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { Explorer } from "../network/explorer";

const prevTxId = (hash: Buffer): string =>
  Buffer.from(Uint8Array.from(hash)).reverse().toString("hex");

function spentOutpoints(signedHex: string): Array<{ txid: string; vout: number }> {
  try {
    return Transaction.fromHex(signedHex).ins.map(i => ({ txid: prevTxId(i.hash), vout: i.index }));
  } catch {
    return [];
  }
}

/**
 * Double-spend guard: refuses to broadcast when an input is already confirmed-spent by another
 * transaction — the explorer reports it with `spent_at_height`.
 */
async function assertInputsUnspent(explorer: Explorer, signedHex: string): Promise<void> {
  const outpoints = spentOutpoints(signedHex);
  for (const txid of new Set(outpoints.map(o => o.txid))) {
    const tx = await explorer.getUtxoTx(txid).catch(() => {
      throw new InvalidTransactionError("tx not found");
    });
    for (const { vout } of outpoints.filter(o => o.txid === txid)) {
      const output = tx.outputs.find(o => o.output_index === vout);
      if (output && typeof output.spent_at_height === "number" && output.spent_at_height > 0) {
        throw new InvalidTransactionError("utxos already spent");
      }
    }
  }
}

export async function broadcast(
  explorer: Explorer,
  signedHex: string,
  broadcastConfig?: BroadcastConfig,
): Promise<string> {
  await assertInputsUnspent(explorer, signedHex);
  return explorer.broadcast(signedHex, broadcastConfig?.source);
}
