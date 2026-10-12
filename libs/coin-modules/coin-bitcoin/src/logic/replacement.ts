import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { RbfBuildError } from "@ledgerhq/wallet-btc/errors";
import { getIncrementalFeeFloorSatVb, scriptToAddress } from "@ledgerhq/wallet-btc/utils";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import type { Explorer } from "../network/explorer";
import { getTxHex } from "./txHex";

/** nSequence below this signals BIP125 replaceability. */
export const RBF_SEQUENCE_THRESHOLD = 0xfffffffe;

const prevTxId = (hash: Buffer): string =>
  Buffer.from(Uint8Array.from(hash)).reverse().toString("hex");

export type OriginalTx = {
  txid: string;
  vsize: number;
  fee: bigint;
  /** sat/vB, rounded up. */
  feePerByte: BigNumber;
  inputs: Array<{
    txid: string;
    vout: number;
    value: bigint;
    address: string | null;
    sequence: number;
  }>;
  outputs: Array<{ index: number; address: string | null; value: bigint }>;
};

/** Decodes a broadcast transaction and the values of its inputs, from the network alone. */
export async function fetchOriginalTx(
  explorer: Explorer,
  crypto: ICrypto,
  txid: string,
): Promise<OriginalTx> {
  let hex: string;
  try {
    hex = await getTxHex(explorer, txid);
  } catch {
    throw new RbfBuildError(`Original transaction ${txid} could not be fetched`);
  }
  const tx = Transaction.fromHex(hex);

  const inputs = await Promise.all(
    tx.ins.map(async input => {
      const previous = prevTxId(input.hash);
      const prevTx = Transaction.fromHex(await getTxHex(explorer, previous));
      const prevOut = prevTx.outs[input.index];
      if (!prevOut) throw new RbfBuildError(`Output index ${input.index} does not exist`);
      return {
        txid: previous,
        vout: input.index,
        value: BigInt(prevOut.value),
        address: safeAddress(prevOut.script, crypto),
        sequence: input.sequence,
      };
    }),
  );
  const outputs = tx.outs.map((out, index) => ({
    index,
    address: safeAddress(out.script, crypto),
    value: BigInt(out.value),
  }));

  const fee = inputs.reduce((s, i) => s + i.value, 0n) - outputs.reduce((s, o) => s + o.value, 0n);
  const vsize = tx.virtualSize();
  return {
    txid,
    vsize,
    fee,
    feePerByte: new BigNumber(fee.toString()).div(vsize).integerValue(BigNumber.ROUND_CEIL),
    inputs,
    outputs,
  };
}

function safeAddress(script: Buffer, crypto: ICrypto): string | null {
  try {
    return scriptToAddress(script, crypto);
  } catch {
    return null;
  }
}

export const isReplaceable = (tx: OriginalTx): boolean =>
  tx.inputs.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD);

/**
 * Minimum total fee for a replacement to beat `tx`: it must pay more in absolute terms (BIP125
 * rule 3) and bump the rate by at least the incremental relay fee (rule 4).
 */
export function minReplacementFeeFor(tx: OriginalTx, incrementalFeePerByte: BigNumber): bigint {
  const fromAbsolute = new BigNumber(tx.fee.toString()).plus(
    incrementalFeePerByte.times(tx.vsize).integerValue(BigNumber.ROUND_CEIL),
  );
  const fromRate = tx.feePerByte
    .plus(incrementalFeePerByte)
    .times(tx.vsize)
    .integerValue(BigNumber.ROUND_CEIL);
  const min = BigNumber.max(fromAbsolute, fromRate, new BigNumber(tx.fee.toString()).plus(1));
  return BigInt(min.toFixed());
}

/**
 * Minimum fee rate (sat/vB) for a replacement of `tx` of the same size: the minimum fee over the
 * size, and strictly above the replaced rate (a speed up starts there).
 */
export function minReplacementFeePerByteFor(
  tx: OriginalTx,
  incrementalFeePerByte: BigNumber,
): BigNumber {
  const minFee = new BigNumber(minReplacementFeeFor(tx, incrementalFeePerByte).toString());
  return BigNumber.max(
    minFee.div(tx.vsize).integerValue(BigNumber.ROUND_CEIL),
    tx.feePerByte.plus(1),
  );
}

export type ReplacementContext = {
  original: OriginalTx;
  originalFee: bigint;
  originalVsize: number;
  /** Network incremental relay fee rate, the floor of the absolute fee increase (rule 4). */
  incrementalFeePerByte: BigNumber;
  /** Over the replaced transaction and every pending one it conflicts with. */
  minReplacementFee: bigint;
  /** Of the replaced transaction alone (see {@link minReplacementFeePerByteFor}). */
  minReplacementFeePerByte: BigNumber;
};

export async function getReplacementContext(
  explorer: Explorer,
  crypto: ICrypto,
  { txid, conflictingTxIds = [] }: { txid: string; conflictingTxIds?: string[] | undefined },
): Promise<ReplacementContext> {
  const original = await fetchOriginalTx(explorer, crypto, txid);
  if (!isReplaceable(original)) {
    throw new RbfBuildError("Transaction is not RBF-enabled");
  }
  const [bumpFeePerByte, incrementalFeePerByte] = await Promise.all([
    getIncrementalFeeFloorSatVb(explorer, original.feePerByte),
    getIncrementalFeeFloorSatVb(explorer),
  ]);

  let minReplacementFee = minReplacementFeeFor(original, bumpFeePerByte);
  for (const conflicting of conflictingTxIds) {
    if (conflicting === txid) continue;
    try {
      const tx = await fetchOriginalTx(explorer, crypto, conflicting);
      if (!isReplaceable(tx)) continue;
      const rate = await getIncrementalFeeFloorSatVb(explorer, tx.feePerByte);
      const min = minReplacementFeeFor(tx, rate);
      if (min > minReplacementFee) minReplacementFee = min;
    } catch {
      // A conflicting transaction gone from the mempool no longer constrains the replacement.
    }
  }

  return {
    original,
    originalFee: original.fee,
    originalVsize: original.vsize,
    incrementalFeePerByte,
    minReplacementFee,
    minReplacementFeePerByte: minReplacementFeePerByteFor(original, bumpFeePerByte),
  };
}
