import { BigNumber } from "bignumber.js";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { computeZip317Fee, zip317MinimumFee } from "../logic/coin-selection";

/**
 * ZIP-317 pricing on top of wallet-btc's sat/vByte model.
 *
 * ZIP-317 charges per logical action -- `max(inputs, outputs)`, floored at two --
 * so the fee owed depends on a transaction's shape, not on its size, and no
 * single rate per vByte can express it. The rate is therefore chosen per
 * transaction: start from one that covers any layout, then tighten it to the
 * layout the build actually produced.
 */

/**
 * Rate that covers ZIP-317 for every layout. The binding case is the smallest
 * transaction that can be built, one input and one output, because the two-action
 * floor applies to it in full: two actions' worth of zats over its vBytes.
 */
export function zcashSafeFeePerByte(
  crypto: ICrypto,
  derivationMode: string,
  marginalFee: number,
): BigNumber {
  const smallestTxVBytes = maxTxVBytesCeil(1, [], true, crypto, derivationMode);
  return new BigNumber(Math.ceil(zip317MinimumFee(marginalFee) / Math.max(1, smallestTxVBytes)));
}

/** What ZIP-317 requires for the layout a build resolved to. */
export const requiredFee = (txInfo: TransactionInfo, marginalFee: number): BigNumber =>
  computeZip317Fee(0, 0, txInfo.inputs.length, txInfo.outputs.length, marginalFee);

export type PricedBuild = { txInfo: TransactionInfo; feePerByte: BigNumber };

/**
 * Builds at the safe rate, then once more at the rate that charges what ZIP-317
 * requires for the resulting layout. The tighter build is kept only if it still
 * covers ZIP-317 (lowering the rate can change which inputs are picked), so the
 * worst outcome is overpaying, never a transaction the node rejects.
 */
export async function buildAtZip317Rate(
  safeFeePerByte: BigNumber,
  marginalFee: number,
  build: (feePerByte: BigNumber) => Promise<TransactionInfo>,
): Promise<PricedBuild> {
  const atSafeRate = await build(safeFeePerByte);
  const charged = new BigNumber(atSafeRate.fee);
  const safe = { txInfo: atSafeRate, feePerByte: safeFeePerByte };
  if (!charged.isFinite() || charged.lte(0)) return safe;

  const tightened = safeFeePerByte
    .times(requiredFee(atSafeRate, marginalFee))
    .div(charged)
    .integerValue(BigNumber.ROUND_CEIL);
  // Nothing to gain when the safe rate is already at or below what this layout owes.
  if (tightened.gte(safeFeePerByte)) return safe;

  try {
    const atTightenedRate = await build(tightened);
    return new BigNumber(atTightenedRate.fee).gte(requiredFee(atTightenedRate, marginalFee))
      ? { txInfo: atTightenedRate, feePerByte: tightened }
      : safe;
  } catch {
    // Not enough balance at the tighter selection, ...: the safe build already succeeded.
    return safe;
  }
}
