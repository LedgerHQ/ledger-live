import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { InvalidAddress, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { Psbt, payments } from "bitcoinjs-lib";
import { coinTraits } from "./coinTraits";
import type { BitcoinContext } from "../config";
import { DustLimit, FeeTooLow } from "../errors";
import { fetchTxHex } from "../network/explorer";
import {
  SIGNING_REQUEST_TYPE,
  type SigningRequest,
  craftsSigningRequest,
  deviceParameters,
  serializeOutputs,
} from "./signingRequest";
import { getFeeRate } from "./getFeeRate";
import { getSpendableUtxos } from "./getSpendableUtxos";
import { type BitcoinIntent, opReturnScript } from "./intent";
import { compressPublicKey } from "./publicKey";
import {
  DerivationModes,
  cryptoFor,
  derivationModeOf,
  dustThreshold,
  selectUtxos,
  transactionSize,
} from "./selectUtxos";

/** Sequence of a final input: no replace-by-fee signalling. */
export const FINAL_SEQUENCE = 0xffffffff;

/** Sequence of an input that signals replace-by-fee (BIP 125), with no relative locktime meaning. */
export const RBF_SEQUENCE = 0xfffffffd;

/** Previous transactions fetched at once, so a many-input transaction does not flood the explorer. */
const PREVIOUS_TX_CONCURRENCY = 8;

/** Fetches each distinct transaction once, a few at a time; returns them by id. */
async function fetchPreviousTransactions(
  fetchHex: (txid: string) => Promise<string>,
  txids: string[],
): Promise<Map<string, string>> {
  const distinct = [...new Set(txids)];
  const byId = new Map<string, string>();
  for (let start = 0; start < distinct.length; start += PREVIOUS_TX_CONCURRENCY) {
    const batch = distinct.slice(start, start + PREVIOUS_TX_CONCURRENCY);
    const hexes = await Promise.all(batch.map(fetchHex));
    batch.forEach((txid, i) => byId.set(txid, hexes[i]));
  }
  return byId;
}

function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`amount ${value} exceeds the supported range`);
  }
  return Number(value);
}

/**
 * Redeem script of the nested SegWit (P2SH-P2WPKH) sender, from its public key; checks that the
 * key is the sender's.
 */
function nestedSegwitRedeemScript(
  senderPublicKey: string | undefined,
  senderScript: Buffer,
): Buffer {
  if (!senderPublicKey) {
    throw new Error("senderPublicKey is required to spend from a nested SegWit address");
  }
  const redeem = payments.p2wpkh({ pubkey: compressPublicKey(senderPublicKey) });
  const p2sh = payments.p2sh({ redeem });
  if (!p2sh.output?.equals(senderScript) || !redeem.output) {
    throw new Error("senderPublicKey does not match the sender address");
  }
  return redeem.output;
}

/**
 * Crafts the unsigned transaction of a native transfer from a single address.
 *
 * Currencies with Bitcoin serialization get a PSBT (BIP 174, base64). The formats the Ledger app
 * builds itself (Komodo, Decred: see `craftsSigningRequest`) get a {@link SigningRequest} (JSON):
 * the same inputs and outputs, with the device-protocol parameters the bridge uses.
 *
 * As the bridge builds them: inputs signal replace-by-fee where the currency's transactions do
 * (bitcoin and its test networks), and the transaction version is the one the currency's Ledger app
 * builds (2 for app-bitcoin-new, 1 otherwise). The outputs are the recipient's, then the OP_RETURN
 * output when the intent carries data (`intent.data.opReturnData`), then the change.
 *
 * The outputs spent are selected as `estimateFees` selects them, the change goes back to the
 * sender, and every input carries what a Ledger signer needs to verify it: the full previous
 * transaction (`nonWitnessUtxo`), the spent output (`witnessUtxo`) for SegWit ones, and the redeem
 * script for nested SegWit. Key derivation information is not part of the PSBT: the signer, which
 * knows the account's derivation path, adds it.
 *
 * `customFees.parameters.feePerByte` imposes a rate (a custom rate under `feesStrategy: "custom"`,
 * used as given); otherwise a positive `customFees.value` imposes the absolute fee (Ledger Live's
 * custom fee). A zero `value` imposes nothing: the rate follows `feesStrategy`.
 * A fee below the network's relay minimum for the transaction's size is refused (`FeeTooLow`).
 * Without `customFees`, the medium explorer rate is used.
 */
export async function craftTransaction(
  context: BitcoinContext,
  currencyId: string,
  intent: BitcoinIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (intent.intentType !== "transaction" || intent.asset.type !== "native") {
    throw new Error("only native transfers are supported");
  }
  const crypto = cryptoFor(currencyId);
  if (!intent.recipient || !crypto.validateAddress(intent.recipient)) {
    throw new InvalidAddress("", { currencyName: currencyId });
  }
  const senderScript = crypto.toOutputScript(intent.sender);
  const recipientScript = crypto.toOutputScript(intent.recipient);
  const opReturn = opReturnScript(intent, crypto);
  const extraOutputScripts = opReturn ? [opReturn] : [];
  const derivationMode = derivationModeOf(senderScript);
  const redeemScript =
    derivationMode === DerivationModes.SEGWIT
      ? nestedSegwitRedeemScript(intent.senderPublicKey, senderScript)
      : undefined;

  const config = await context.config(currencyId);
  const imposedRate = customFees?.parameters?.feePerByte;
  const [utxos, { feePerByte, relayFeePerByte }] = await Promise.all([
    getSpendableUtxos(config, currencyId, intent.sender),
    getFeeRate(config, currencyId, {
      feePerByte: imposedRate,
      feesStrategy: customFees?.parameters?.feesStrategy,
    }),
  ]);

  const selection = selectUtxos({
    utxos,
    amount: intent.amount,
    useAllAmount: !!intent.useAllAmount,
    recipientScript,
    crypto,
    derivationMode,
    feePerByte,
    relayFeePerByte,
    extraOutputScripts,
    // An absolute fee is imposed only when one is given: some callers (e.g. coin-service) send
    // `value: 0n` alongside the fee parameters to mean "no absolute fee".
    ...(customFees && imposedRate === undefined && customFees.value > 0n
      ? { fixedFee: customFees.value }
      : {}),
  });
  if (!selection.sufficient) throw new NotEnoughBalance();
  const withChange = selection.change > 0n;
  const size = transactionSize(
    selection.inputs.length,
    recipientScript,
    withChange,
    crypto,
    derivationMode,
    extraOutputScripts,
  );
  if (selection.fee < BigInt(size) * relayFeePerByte) throw new FeeTooLow();
  const dust = dustThreshold(crypto, size, derivationMode, relayFeePerByte);
  if (selection.amount < dust) throw new DustLimit();

  const signingRequest = craftsSigningRequest(currencyId);
  const traits = coinTraits[currencyId];
  const sequence = traits?.signalsRbf ? RBF_SEQUENCE : FINAL_SEQUENCE;
  // Every input carries its previous transaction, Taproot included: the trusted-input flow every
  // Ledger app but app-bitcoin-new uses verifies spent amounts from it (`deviceSigningParameters`).
  const previousTxs = await fetchPreviousTransactions(
    txid => fetchTxHex(config, currencyId, txid),
    selection.inputs.map(utxo => utxo.hash),
  );
  const previousTx = (txid: string): string => {
    const hex = previousTxs.get(txid);
    if (hex === undefined) throw new Error(`previous transaction ${txid} was not fetched`);
    return hex;
  };
  const outputs = [
    { script: recipientScript, value: selection.amount },
    ...(opReturn ? [{ script: opReturn, value: 0n }] : []),
    ...(withChange ? [{ script: senderScript, value: selection.change }] : []),
  ];

  const details = {
    fee: selection.fee,
    feePerByte,
    amount: selection.amount,
    change: selection.change,
    inputs: selection.inputs.map(utxo => ({
      hash: utxo.hash,
      outputIndex: utxo.outputIndex,
      value: BigInt(utxo.value),
    })),
  };

  if (signingRequest) {
    const parameters = deviceParameters(currencyId, derivationMode, intent.recipient, new Date());
    const request: SigningRequest = {
      type: SIGNING_REQUEST_TYPE,
      version: 1,
      currencyId,
      inputs: selection.inputs.map(utxo => ({
        txid: utxo.hash,
        vout: utxo.outputIndex,
        value: utxo.value,
        prevTxHex: previousTx(utxo.hash),
        sequence,
      })),
      outputs: outputs.map(output => ({
        script: output.script.toString("hex"),
        value: output.value.toString(),
      })),
      outputScriptHex: serializeOutputs(outputs, parameters.additionals),
      ...(withChange ? { changeOutputIndex: outputs.length - 1 } : {}),
      ...parameters,
    };
    return { transaction: JSON.stringify(request), details };
  }

  const psbt = new Psbt();
  psbt.setVersion(traits?.signsPsbt ? 2 : 1);
  psbt.setLocktime(0);
  selection.inputs.forEach(utxo => {
    psbt.addInput({
      hash: utxo.hash,
      index: utxo.outputIndex,
      sequence,
      nonWitnessUtxo: Buffer.from(previousTx(utxo.hash), "hex"),
      ...(derivationMode === DerivationModes.LEGACY
        ? {}
        : {
            // Every output a single-address account spends pays the sender's script.
            witnessUtxo: {
              script: senderScript,
              value: toSafeNumber(BigInt(utxo.value)),
            },
          }),
      ...(redeemScript ? { redeemScript } : {}),
    });
  });
  outputs.forEach(output =>
    psbt.addOutput({ script: output.script, value: toSafeNumber(output.value) }),
  );

  return { transaction: psbt.toBase64(), details };
}
