import type { BitcoinCoinConfig } from "../config";
import { getFeeRate } from "./getFeeRate";
import { getSpendableUtxos } from "./getSpendableUtxos";
import type { BitcoinIntent } from "./intent";
import { opReturnScript } from "./intent";
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
  /** Selected outputs, fee, amount sent and change (see `selectUtxos`). */
  selection: UtxoSelection;
  /** Virtual size of the transaction, in vbytes. */
  vsize: number;
};

/**
 * Plans the transaction of an intent from a single address: its scripts, its fee rate, and the
 * outputs it spends, selected from the sender's spendable outputs (see `getSpendableUtxos`) as
 * `selectUtxos` selects them. `estimateFees` and `craftTransaction` both start from it, so the
 * estimate prices exactly what crafting builds.
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

  const [utxos, { feePerByte, relayFeePerByte }] = await Promise.all([
    getSpendableUtxos(config, intent.sender),
    getFeeRate(config, {
      feePerByte: fees.feePerByte,
      feesStrategy: fees.fixedFee === undefined ? fees.feesStrategy : "custom",
    }),
  ]);

  const selection = selectUtxos({
    utxos,
    amount: intent.amount,
    useAllAmount: !!intent.useAllAmount,
    recipientScript: recipient,
    crypto,
    derivationMode,
    feePerByte,
    relayFeePerByte,
    extraOutputScripts,
    ...(fees.fixedFee === undefined ? {} : { fixedFee: fees.fixedFee }),
  });
  const vsize = transactionSize(
    selection.inputs.length,
    recipient,
    selection.change > 0n,
    crypto,
    derivationMode,
    extraOutputScripts,
  );

  return {
    crypto,
    derivationMode,
    senderScript,
    recipientScript: recipient,
    opReturn,
    feePerByte,
    relayFeePerByte,
    selection,
    vsize,
  };
}
