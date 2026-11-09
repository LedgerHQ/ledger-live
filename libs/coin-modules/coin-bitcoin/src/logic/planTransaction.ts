import type { BitcoinCoinConfig } from "../config";
import { InvalidReplacementInput, ReplacementNotSupported, UnknownUtxo } from "../errors";
import { getFeeRate } from "./getFeeRate";
import { getSpendableUtxosWithMempool, outpoint } from "./getSpendableUtxos";
import type { BitcoinIntent } from "./intent";
import { coinControlOf, opReturnScript } from "./intent";
import type { DerivationModes, ICrypto, UtxoSelection } from "./selectUtxos";
import { cryptoFor, derivationModeOf, selectUtxos, transactionSize } from "./selectUtxos";

/** How the fee of a planned transaction is set. */
export type FeeOptions = {
  /** Rate imposed by the caller, sat/vB. */
  feePerByte?: unknown;
  /** `fast` | `medium` | `slow` | `custom`: see `getFeeRate`. */
  feesStrategy?: unknown;
  /** Absolute fee imposed by the caller, in satoshis. */
  fixedFee?: bigint;
};

/**
 * The transaction an intent produces, before it is serialized: what `estimateFees` prices and
 * `craftTransaction` builds.
 */
export type TransactionPlan = {
  crypto: ICrypto;
  derivationMode: DerivationModes;
  senderScript: Buffer;
  recipientScript: Buffer;
  /** The OP_RETURN output script, when the intent carries data. */
  opReturn: Buffer | undefined;
  /** Rate the transaction pays, and the network's minimum relay rate, in sat/vB. */
  feePerByte: bigint;
  relayFeePerByte: bigint;
  /** Minimum rate increase of a replacement, in sat/vB. */
  incrementalRelayFeePerByte: bigint;
  /** Selected outputs, fee, amount sent and change (see `selectUtxos`). */
  selection: UtxoSelection;
  /** Virtual size of the transaction, in vbytes. */
  vsize: number;
};

/**
 * Bytes a currency's transaction format carries that wallet-btc's size maths (`maxTxSizeCeil`) leave
 * out, for `inputCount` inputs, read from its config:
 *
 * - Komodo (expiry height and extra data): the Sapling version group id (4), the expiry height (4)
 *   and the empty Sapling fields (11).
 * - Decred (expiry height only): the expiry height (4), the witness count (1), the change output's
 *   script version (2) and each input's tree byte (1). wallet-btc over-counts the other outputs (8
 *   bytes each for a 2-byte script version), which is left as margin.
 */
export function formatBytes(config: BitcoinCoinConfig, inputCount: number): number {
  const { expiryHeight, extraData } = config.transaction ?? {};
  if (!expiryHeight) return 0;
  return extraData ? 19 : 7 + inputCount;
}

/**
 * Plans the transaction of an intent from a single address: its scripts, its fee rate, and the
 * outputs it spends, selected from the sender's spendable outputs (see `getSpendableUtxos`) as
 * `selectUtxos` selects them. `estimateFees` and `craftTransaction` both start from it, so the
 * estimate prices exactly what crafting builds.
 *
 * The intent's coin control (`data.utxoStrategy`, see `coinControlOf`) narrows and orders the
 * outputs: excluded ones are never spent, selected ones always are.
 *
 * Selecting an output a pending transaction of the address already spends plans that transaction's
 * replacement (speed-up or cancel), on a currency that signals RBF (`ReplacementNotSupported`
 * otherwise). The replacement spends exactly the selected outputs, as any selection. Each must be
 * an input of a replaced transaction (even an unconfirmed one: the original already spent it), or a
 * confirmed output; anything else is refused (`InvalidReplacementInput`), as the node would refuse
 * it at broadcast: an output a replaced transaction creates (it would conflict with itself), or any
 * other unconfirmed output, which adds an unconfirmed input (BIP-125).
 *
 * `recipientScript` defaults to the intent's recipient; `estimateFees` passes the sender's own
 * script while the recipient is not yet a valid address. An imposed absolute fee reads no explorer
 * rate: only the relay floor.
 */
export async function planTransaction(
  config: BitcoinCoinConfig,
  currencyId: string,
  intent: BitcoinIntent,
  fees: FeeOptions = {},
  recipientScript?: Buffer,
): Promise<TransactionPlan> {
  const crypto = cryptoFor(currencyId);
  const senderScript = crypto.toOutputScript(intent.sender);
  const recipient = recipientScript ?? crypto.toOutputScript(intent.recipient);
  const opReturn = opReturnScript(intent, crypto);
  const extraOutputScripts = opReturn ? [opReturn] : [];
  const derivationMode = derivationModeOf(senderScript);
  const control = coinControlOf(intent);

  const [{ spendable, mempool }, { feePerByte, relayFeePerByte, incrementalRelayFeePerByte }] =
    await Promise.all([
      getSpendableUtxosWithMempool(config, intent.sender),
      getFeeRate(config, {
        feePerByte: fees.feePerByte,
        feesStrategy: fees.fixedFee === undefined ? fees.feesStrategy : "custom",
      }),
    ]);

  const selectedIds = control.selected.map(ref => outpoint(ref.hash, ref.outputIndex));
  const replaced = new Set(
    selectedIds.flatMap(id => {
      const txid = mempool.spentBy.get(id);
      return txid ? [txid] : [];
    }),
  );
  const replacing = selectedIds.some(id => mempool.spent.has(id));
  if (replacing && !config.transaction?.signalsRbf) {
    throw new ReplacementNotSupported(`${currencyId} does not signal replaceability (RBF)`, {
      utxoIds: selectedIds.filter(id => mempool.spent.has(id)),
    });
  }

  const excluded = new Set(control.excluded.map(ref => outpoint(ref.hash, ref.outputIndex)));
  const replacedOutputs = new Set(
    [...replaced].flatMap(txid =>
      (mempool.createdBy.get(txid) ?? []).map(utxo => outpoint(utxo.hash, utxo.outputIndex)),
    ),
  );
  const candidates = spendable.filter(utxo => {
    const id = outpoint(utxo.hash, utxo.outputIndex);
    return !excluded.has(id) && !replacedOutputs.has(id);
  });
  const ownChangeIds = new Set(
    mempool.ownChange.map(utxo => outpoint(utxo.hash, utxo.outputIndex)),
  );
  // A selected output is spendable, or spent by a pending transaction that is replaced; any other
  // is refused here, in one place. A replacement also refuses the outputs the node would.
  const selected = selectedIds.map(id => {
    if (replacing && replacedOutputs.has(id)) {
      throw new InvalidReplacementInput(
        `UTXO ${id} is created by a transaction the replacement replaces`,
        { utxoIds: [id] },
      );
    }
    if (replacing && !mempool.spent.has(id) && ownChangeIds.has(id)) {
      throw new InvalidReplacementInput(`UTXO ${id} is unconfirmed: a replacement cannot add it`, {
        utxoIds: [id],
      });
    }
    const found =
      candidates.find(utxo => outpoint(utxo.hash, utxo.outputIndex) === id) ??
      mempool.spentUtxos.find(utxo => outpoint(utxo.hash, utxo.outputIndex) === id);
    if (!found) throw new UnknownUtxo(`UTXO ${id} is not a spendable output`, { utxoId: id });
    return found;
  });
  const chosenIds = new Set(selectedIds);

  const selection = selectUtxos({
    utxos: candidates.filter(utxo => !chosenIds.has(outpoint(utxo.hash, utxo.outputIndex))),
    selected,
    strategy: control.strategy,
    amount: intent.amount,
    useAllAmount: !!intent.useAllAmount,
    recipientScript: recipient,
    crypto,
    derivationMode,
    feePerByte,
    relayFeePerByte,
    extraOutputScripts,
    formatBytes: inputCount => formatBytes(config, inputCount),
    ...(fees.fixedFee === undefined ? {} : { fixedFee: fees.fixedFee }),
  });
  const vsize = transactionSize(
    selection.inputs.length,
    recipient,
    selection.change > 0n,
    crypto,
    derivationMode,
    extraOutputScripts,
    formatBytes(config, selection.inputs.length),
  );

  return {
    crypto,
    derivationMode,
    senderScript,
    recipientScript: recipient,
    opReturn,
    feePerByte,
    relayFeePerByte,
    incrementalRelayFeePerByte,
    selection,
    vsize,
  };
}
