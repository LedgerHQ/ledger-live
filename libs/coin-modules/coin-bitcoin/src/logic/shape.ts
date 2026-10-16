import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { RbfBuildError } from "@ledgerhq/wallet-btc/errors";
import { computeDustAmount, maxTxSizeCeil, maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import type { BitcoinDerivationMode } from "./types";
import type { ReplacementContext } from "./replacement";

// bitcoinjs serializes output values as JS numbers, so a larger amount is split in several outputs.
const OUTPUT_VALUE_MAX = BigInt(Number.MAX_SAFE_INTEGER);

export type ShapeInput = {
  txid: string;
  vout: number;
  value: bigint;
  address: string;
  path: string;
  blockHeight: number | null;
};

export type ShapeOutput = {
  script: Buffer;
  value: bigint;
  address: string | null;
  isChange: boolean;
};

export type TxShape = {
  inputs: ShapeInput[];
  outputs: ShapeOutput[];
  /** Total of the inputs. */
  total: bigint;
  /** Amount sent to the recipient. */
  amount: bigint;
  fee: bigint;
};

export type ShapeParams = {
  crypto: ICrypto;
  derivationMode: BitcoinDerivationMode;
  inputs: ShapeInput[];
  recipient: string;
  amount: bigint;
  useAllAmount: boolean;
  opReturnData?: Buffer | undefined;
  change?: { address: string } | undefined;
  feePerByte: BigNumber;
  relayFeePerByte?: BigNumber | undefined;
  replacement?: ReplacementContext | undefined;
};

const sum = (values: bigint[]): bigint => values.reduce((a, b) => a + b, 0n);

function recipientOutputs(
  crypto: ICrypto,
  recipient: string,
  amount: bigint,
  opReturnData?: Buffer,
): ShapeOutput[] {
  const outputs: ShapeOutput[] = [];
  if (opReturnData) {
    outputs.push({
      script: crypto.toOpReturnOutputScript(opReturnData),
      value: 0n,
      address: null,
      isChange: false,
    });
  }
  const script = crypto.toOutputScript(recipient);
  let left = amount;
  while (left > OUTPUT_VALUE_MAX) {
    outputs.push({ script, value: OUTPUT_VALUE_MAX, address: recipient, isChange: false });
    left -= OUTPUT_VALUE_MAX;
  }
  if (left > 0n) {
    outputs.push({ script, value: left, address: recipient, isChange: false });
  }
  return outputs;
}

const feeFor = (
  rate: number,
  inputCount: number,
  scripts: Buffer[],
  withChange: boolean,
  crypto: ICrypto,
  derivationMode: string,
): bigint =>
  BigInt(rate * maxTxVBytesCeil(inputCount, scripts, withChange, crypto, derivationMode));

/**
 * Lays out the transaction spending `inputs`: recipient outputs, change and fee. Shared by the fee
 * estimation, the validation and the crafting, so the three always agree.
 *
 * The change output is added only when it is worth more than the dust limit; otherwise what is left
 * goes to the miners — exactly the outcome of the picking strategies and `Xpub.buildTx`.
 */
export function computeShape(params: ShapeParams): TxShape {
  const { crypto, derivationMode, inputs, recipient, opReturnData, change, replacement } = params;
  const rate = Math.max(1, Math.ceil(params.feePerByte.toNumber()));
  const total = sum(inputs.map(i => i.value));
  const n = inputs.length;

  if (n === 0) throw new NotEnoughBalance();

  const scriptsFor = (amount: bigint) =>
    recipientOutputs(crypto, recipient, amount, opReturnData).map(o => o.script);

  let amount = params.amount;
  if (params.useAllAmount) {
    // Send-max spends everything, there is no change; the recipient output size does not depend
    // on its value, so the fee can be computed before the amount.
    const fee = feeFor(rate, n, scriptsFor(1n), false, crypto, derivationMode);
    amount = total - fee;
    if (amount <= 0n) throw new NotEnoughBalance();
  }

  const outputs = recipientOutputs(crypto, recipient, amount, opReturnData);
  const scripts = outputs.map(o => o.script);
  const feeWithoutChange = feeFor(rate, n, scripts, false, crypto, derivationMode);
  let feeWithChange = feeFor(rate, n, scripts, true, crypto, derivationMode);
  if (replacement && feeWithChange < replacement.minReplacementFee) {
    feeWithChange = replacement.minReplacementFee;
  }

  // A replacement may still balance by reducing a wallet-controlled output (see below).
  if (replacement ? total < amount : total < amount + feeWithoutChange) {
    throw new NotEnoughBalance();
  }

  const dustLimit = BigInt(
    computeDustAmount(crypto, maxTxSizeCeil(n, scripts, true, crypto, derivationMode), {
      derivationMode,
      relayFeePerByteSatVb: params.relayFeePerByte,
    }),
  );

  const surplus = total - amount - feeWithChange;
  if (change && surplus > dustLimit && !params.useAllAmount) {
    outputs.push({
      script: crypto.toOutputScript(change.address),
      value: surplus,
      address: change.address,
      isChange: true,
    });
  }

  if (replacement) {
    enforceAbsoluteFeeIncrease({
      replacement,
      total,
      outputs,
      dustLimit,
      replacementVsize: maxTxSizeCeil(n, scripts, true, crypto, derivationMode),
      fallbackReducibleAddress: change?.address,
    });
  }

  const finalAmount = sum(
    outputs.filter(o => !o.isChange && o.address === recipient).map(o => o.value),
  );
  return {
    inputs,
    outputs,
    total,
    amount: finalAmount,
    fee: total - sum(outputs.map(o => o.value)),
  };
}

/**
 * BIP125 rule 4: a replacement must raise the absolute fee by at least the incremental relay fee
 * times its size. When the rate alone does not get there, a wallet-controlled output pays the
 * difference — the change, or for a cancel the output back to the account (ported from
 * `Xpub.enforceRbfAbsoluteFeeIncrease`).
 */
function enforceAbsoluteFeeIncrease({
  replacement,
  total,
  outputs,
  dustLimit,
  replacementVsize,
  fallbackReducibleAddress,
}: {
  replacement: ReplacementContext;
  total: bigint;
  outputs: ShapeOutput[];
  dustLimit: bigint;
  replacementVsize: number;
  fallbackReducibleAddress: string | undefined;
}): void {
  const requiredVsize = Math.max(replacement.originalVsize, replacementVsize);
  const minIncrease = BigInt(
    replacement.incrementalFeePerByte
      .times(requiredVsize)
      .integerValue(BigNumber.ROUND_CEIL)
      .toFixed(),
  );
  const fee = total - sum(outputs.map(o => o.value));
  const increase = fee - replacement.originalFee;
  if (increase >= minIncrease) return;

  const missing = minIncrease - increase;
  const reducible =
    outputs.find(o => o.isChange) ??
    (fallbackReducibleAddress
      ? outputs.find(o => !o.isChange && o.address === fallbackReducibleAddress)
      : undefined);
  if (!reducible) {
    throw new RbfBuildError(
      `Failed to build RBF transaction: RBF requires an additional ${missing} sats fee increase but there is no change output to reduce (e.g. send-max). Cannot build a valid replacement.`,
    );
  }
  const reduced = reducible.value - missing;
  if (reduced < dustLimit) {
    outputs.splice(outputs.indexOf(reducible), 1);
  } else {
    reducible.value = reduced;
  }
}
