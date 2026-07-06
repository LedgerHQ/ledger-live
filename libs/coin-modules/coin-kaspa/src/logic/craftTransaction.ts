import { BigNumber } from "bignumber.js";
import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getFeeEstimate, getUtxosForAddresses } from "../network";
import { ApiResponseUtxo, KaspaUtxo } from "../types";
import { addressToScriptPublicKey, isValidKaspaAddress } from "./kaspaAddresses";
import { calcMaxSpendableAmount } from "./utxos/lib";
import { selectUtxos } from "./utxos/selection";

export type UnsignedKaspaInput = {
  prevTxId: string;
  outpointIndex: number;
  value: number;
};

export type UnsignedKaspaOutput = {
  value: number;
  scriptPublicKey: string;
};

export type UnsignedKaspaTransaction = {
  version: number;
  inputs: UnsignedKaspaInput[];
  outputs: UnsignedKaspaOutput[];
};

function toKaspaUtxos(raw: ApiResponseUtxo[]): KaspaUtxo[] {
  // accountType/accountIndex are HD-derivation metadata the legacy (xpub-scanning) bridge
  // attaches per address; the Alpaca API crafts from a single plain address with no HD context,
  // so they are unused placeholders here (combine's device-signing path resolves the signing
  // path independently of this module).
  return raw.map(utxo => ({
    ...utxo,
    accountType: 0,
    accountIndex: 0,
    utxoEntry: { ...utxo.utxoEntry, amount: new BigNumber(utxo.utxoEntry.amount) },
  }));
}

async function resolveFeeRate(feesStrategy: TransactionIntent["feesStrategy"]): Promise<number> {
  const estimate = await getFeeEstimate();
  if (feesStrategy === "fast") {
    return estimate.priorityBucket.feerate;
  }
  if (feesStrategy === "slow") {
    return estimate.lowBuckets[0]?.feerate ?? estimate.priorityBucket.feerate;
  }
  return estimate.normalBuckets[0]?.feerate ?? estimate.priorityBucket.feerate;
}

/**
 * Craft an unsigned native KAS transaction from a CoinModule intent: selects UTXOs for
 * `intent.sender` (via the shared `logic/utxos/selection` primitive) and computes a mass-based
 * fee (via the shared fee-rate + mass primitives), mirroring `bridge/buildTransaction.ts` without
 * its xpub/HD-address scanning (the Alpaca API is single-address, unlike the legacy bridge).
 *
 * The returned `transaction` is a JSON-serialized `UnsignedKaspaTransaction`; `combine` parses it
 * back and must stay in sync with this shape.
 */
export async function craftTransaction(
  intent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isValidKaspaAddress(intent.sender)) {
    throw new Error("kaspa: invalid sender address");
  }
  if (!isValidKaspaAddress(intent.recipient)) {
    throw new Error("kaspa: invalid recipient address");
  }

  const rawUtxos = await getUtxosForAddresses([intent.sender]);
  const utxos = toKaspaUtxos(rawUtxos);
  if (utxos.length === 0) {
    throw new Error("kaspa: no spendable UTXOs for sender address");
  }

  const recipientIsEcdsa = intent.recipient.length > 67;
  const feerate = await resolveFeeRate(intent.feesStrategy);

  // A max-amount send targets the maximum the selected UTXO set can cover (mass/fee included);
  // selectUtxos then converges on (near) zero change, matching a sweep to the recipient.
  const amount = intent.useAllAmount
    ? calcMaxSpendableAmount(utxos, recipientIsEcdsa, feerate)
    : new BigNumber(intent.amount.toString());
  if (amount.lte(0)) {
    throw new Error("kaspa: transaction amount must be positive");
  }

  const selection = selectUtxos(utxos, recipientIsEcdsa, amount, feerate);

  const fee = customFees ? new BigNumber(customFees.value.toString()) : selection.fee;
  // A custom fee shifts the delta to/from the change output; selection.fee/changeAmount already
  // balance against the default estimate, so re-derive change from the (possibly overridden) fee.
  const changeAmount = selection.changeAmount.plus(selection.fee).minus(fee);
  if (changeAmount.isNegative()) {
    throw new Error("kaspa: custom fee exceeds the amount available from the selected UTXOs");
  }

  const inputs: UnsignedKaspaInput[] = selection.utxos.map(utxo => ({
    prevTxId: utxo.outpoint.transactionId,
    outpointIndex: utxo.outpoint.index,
    value: utxo.utxoEntry.amount.toNumber(),
  }));

  const outputs: UnsignedKaspaOutput[] = [
    { value: amount.toNumber(), scriptPublicKey: addressToScriptPublicKey(intent.recipient) },
  ];
  if (changeAmount.isGreaterThan(0)) {
    outputs.push({
      value: changeAmount.toNumber(),
      scriptPublicKey: addressToScriptPublicKey(intent.sender),
    });
  }

  const unsignedTransaction: UnsignedKaspaTransaction = { version: 0, inputs, outputs };

  return {
    transaction: JSON.stringify(unsignedTransaction),
    details: { fee: fee.toFixed(0) },
  };
}
