import type { PendingTransaction } from "@ledgerhq/coin-module-framework/api/types";
import { Transaction } from "bitcoinjs-lib";
import type { BitcoinCoinConfig, BitcoinContext } from "../config";
import { fetchPendingTx, fetchPendingTxHex } from "../network/explorer";
import type { ExplorerTx } from "../network/types";
import { toBlockTransaction } from "./getBlock";
import { outpoint } from "./getSpendableUtxos";

/** What a caller needs to replace the transaction (ADR-020): its inputs, and its size. */
export type BitcoinPendingTransactionDetails = {
  /** The outputs it spends, as `txid:vout` ids and values: `selectedUtxos` for a replacement. */
  inputs: { id: string; value: bigint }[];
  /** Virtual size (vbytes), for BIP-125's rate rule. */
  vsize: number;
};

/**
 * Every output the transaction spends, with its value. A replacement spends exactly these and a
 * cancel sends back what they hold, so an input the explorer describes without its outpoint or
 * value is refused rather than left out or counted as zero. A coinbase input spends no output.
 */
function spentInputs(tx: ExplorerTx): BitcoinPendingTransactionDetails["inputs"] {
  const inputs: BitcoinPendingTransactionDetails["inputs"] = [];
  for (const input of tx.inputs) {
    if (input.coinbase) continue;
    const txid = input.output_tx_id ?? input.output_hash;
    if (
      !txid ||
      typeof input.output_index !== "number" ||
      input.value === undefined ||
      input.value === null
    ) {
      throw new Error(
        `the explorer describes an input of transaction ${tx.hash} without its outpoint or value`,
      );
    }
    inputs.push({ id: outpoint(txid, input.output_index), value: BigInt(input.value) });
  }
  return inputs;
}

// Formats bitcoinjs-lib cannot parse (Komodo, Decred, Zcash) carry no witness: size = vsize.
function virtualSize(hex: string): number {
  try {
    return Transaction.fromHex(hex).virtualSize();
  } catch {
    return hex.length / 2;
  }
}

/**
 * The transaction and its raw hex while the explorer still holds it unmined, else `undefined`. The
 * explorer can keep describing a replaced or dropped transaction after its hex is gone, and keeps
 * listing mined and replaced ones as an address's pending for minutes: both are ruled out here.
 */
export async function fetchStillPending(
  config: Pick<BitcoinCoinConfig, "explorer" | "explorerId">,
  hash: string,
): Promise<{ tx: ExplorerTx; hex: string } | undefined> {
  const tx = await fetchPendingTx(config, hash);
  if (!tx || tx.block) return undefined;
  const hex = await fetchPendingTxHex(config, hash);
  return hex === undefined ? undefined : { tx, hex };
}

/**
 * The transaction if the explorer sees it as pending, else `undefined` (mined, dropped, replaced
 * or unknown), as ADR-017 asks. A snapshot: its `fees` are exact and its `date` is the explorer's
 * first sighting, else the request time. Any other explorer failure is rethrown, and so is an
 * input described without its outpoint or value (see `spentInputs`).
 */
export async function getPendingTransaction(
  context: BitcoinContext,
  currencyId: string,
  hash: string,
): Promise<PendingTransaction | undefined> {
  const config = await context.config(currencyId);
  const pending = await fetchStillPending(config, hash);
  if (!pending) return undefined;
  const { tx, hex } = pending;
  const details: BitcoinPendingTransactionDetails = {
    inputs: spentInputs(tx),
    vsize: virtualSize(hex),
  };
  const { failed: _failed, ...transaction } = toBlockTransaction(tx);
  return {
    ...transaction,
    date: tx.received_at ? new Date(tx.received_at) : new Date(),
    details,
  };
}
