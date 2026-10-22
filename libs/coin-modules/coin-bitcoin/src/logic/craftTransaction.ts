import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { Psbt, payments } from "bitcoinjs-lib";
import type { BitcoinCoinConfig, BitcoinContext } from "../config";
import { fetchTxHex } from "../network/explorer";
import type { BitcoinIntent } from "./intent";
import type { TransactionPlan } from "./planTransaction";
import { planTransaction } from "./planTransaction";
import { sameBytes } from "./bytes";
import { compressPublicKey } from "./publicKey";
import { DerivationModes } from "./selectUtxos";
import type { SigningRequest } from "./signingRequest";
import { SIGNING_REQUEST_TYPE, formatParameters, serializeOutputs } from "./signingRequest";

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
  if (!sameBytes(p2sh.output, senderScript) || !redeem.output) {
    throw new Error("senderPublicKey does not match the sender address");
  }
  return Buffer.from(redeem.output);
}

type Output = { script: Buffer; value: bigint };

/** The outputs, in order: the recipient's, the OP_RETURN one if any, then the change. */
function outputsOf(plan: TransactionPlan): Output[] {
  const { selection, recipientScript, opReturn, senderScript } = plan;
  return [
    { script: recipientScript, value: selection.amount },
    ...(opReturn ? [{ script: opReturn, value: 0n }] : []),
    ...(selection.change > 0n ? [{ script: senderScript, value: selection.change }] : []),
  ];
}

/**
 * The PSBT of a planned transaction. Every input carries what a Ledger signer needs to verify it:
 * the full previous transaction (`nonWitnessUtxo`), the spent output (`witnessUtxo`) for SegWit
 * ones, and the redeem script for nested SegWit. Key derivation information is not part of the
 * PSBT: the signer, which knows the account's derivation path, adds it.
 */
function buildPsbt(
  config: BitcoinCoinConfig,
  plan: TransactionPlan,
  sequence: number,
  previousTx: (txid: string) => string,
  redeemScript: Buffer | undefined,
): string {
  const psbt = new Psbt();
  psbt.setVersion(config.transaction?.version ?? 1);
  psbt.setLocktime(0);
  plan.selection.inputs.forEach(utxo => {
    psbt.addInput({
      hash: utxo.hash,
      index: utxo.outputIndex,
      sequence,
      nonWitnessUtxo: Buffer.from(previousTx(utxo.hash), "hex"),
      ...(plan.derivationMode === DerivationModes.LEGACY
        ? {}
        : {
            // Every output a single-address account spends pays the sender's script.
            witnessUtxo: {
              script: plan.senderScript,
              value: BigInt(utxo.value),
            },
          }),
      ...(redeemScript ? { redeemScript } : {}),
    });
  });
  outputsOf(plan).forEach(output => psbt.addOutput({ script: output.script, value: output.value }));
  return psbt.toBase64();
}

/**
 * The {@link SigningRequest} of a planned transaction, for the formats the Ledger app builds itself
 * (Komodo, Decred): the same inputs and outputs, with the `createPaymentTransaction` parameters the bridge
 * uses.
 */
function buildSigningRequest(
  config: BitcoinCoinConfig,
  currencyId: string,
  recipient: string,
  plan: TransactionPlan,
  sequence: number,
  previousTx: (txid: string) => string,
): string {
  const outputs = outputsOf(plan);
  const parameters = formatParameters(
    config,
    currencyId,
    plan.derivationMode,
    recipient,
    new Date(),
  );
  const request: SigningRequest = {
    type: SIGNING_REQUEST_TYPE,
    version: 1,
    currencyId,
    inputs: plan.selection.inputs.map(utxo => ({
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
    ...(plan.selection.change > 0n ? { changeOutputIndex: outputs.length - 1 } : {}),
    ...parameters,
  };
  return JSON.stringify(request);
}

/**
 * Crafts the unsigned transaction of a native transfer from a single address: the transaction
 * `planTransaction` plans (the same `estimateFees` prices), serialized.
 *
 * Currencies with Bitcoin serialization get a PSBT (BIP 174, base64). The formats carrying an
 * expiry height (`transaction.expiryHeight` in the config: Komodo's Sapling transactions, Decred's)
 * are not Bitcoin serialization: the Ledger app builds them itself, from a {@link SigningRequest}
 * (JSON), as the bridge has it build every transaction.
 * As the bridge builds them, from the currency's config (`transaction`): inputs signal
 * replace-by-fee where the currency's transactions do (bitcoin and its test networks), and the
 * transaction version is the one the currency's Ledger app builds (2 for app-bitcoin-new, 1
 * otherwise).
 *
 * `customFees.parameters.feePerByte` imposes a rate (a custom rate under `feesStrategy: "custom"`,
 * used as given); otherwise a positive `customFees.value` imposes the absolute fee (Ledger Live's
 * custom fee). A zero `value` imposes nothing: the rate follows `feesStrategy`. Without
 * `customFees`, the medium explorer rate is used.
 *
 * Crafting refuses only what it cannot build: an intent other than a native transfer, a recipient
 * or sender that is not an address of the currency, outputs that do not cover the intent
 * (`NotEnoughBalance`). Whether the fee meets the relay minimum and the amount the dust threshold is
 * `validateIntent`'s to report; the node refuses such a transaction at `broadcast`.
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
  const config = await context.config(currencyId);
  const imposedRate = customFees?.parameters?.feePerByte;
  // An absolute fee is imposed only when one is given: some callers (e.g. coin-service) send
  // `value: 0n` alongside the fee parameters to mean "no absolute fee".
  const fixedFee =
    customFees && imposedRate === undefined && customFees.value > 0n ? customFees.value : undefined;
  const plan = await planTransaction(config, currencyId, intent, {
    feePerByte: imposedRate,
    feesStrategy: customFees?.parameters?.feesStrategy,
    ...(fixedFee === undefined ? {} : { fixedFee }),
  });
  if (!plan.selection.sufficient) throw new NotEnoughBalance();
  const redeemScript =
    plan.derivationMode === DerivationModes.SEGWIT
      ? nestedSegwitRedeemScript(intent.senderPublicKey, plan.senderScript)
      : undefined;

  // Every input carries its previous transaction, Taproot included: the trusted-input flow every
  // Ledger app but app-bitcoin-new uses verifies spent amounts from it (`paymentTransactionParameters`).
  const previousTxs = await fetchPreviousTransactions(
    txid => fetchTxHex(config, txid),
    plan.selection.inputs.map(utxo => utxo.hash),
  );
  const previousTx = (txid: string): string => {
    const hex = previousTxs.get(txid);
    if (hex === undefined) throw new Error(`previous transaction ${txid} was not fetched`);
    return hex;
  };
  const sequence = config.transaction?.signalsRbf ? RBF_SEQUENCE : FINAL_SEQUENCE;

  const { selection, feePerByte } = plan;
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
  const transaction = config.transaction?.expiryHeight
    ? buildSigningRequest(config, currencyId, intent.recipient, plan, sequence, previousTx)
    : buildPsbt(config, plan, sequence, previousTx, redeemScript);
  return { transaction, details };
}
