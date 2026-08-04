import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { calculateFees } from "../../cache";
import type { Transaction } from "../../types";
import { computeZip317Fee, ZIP317_MINIMUM_FEE } from "./coin-selection";

/**
 * ZIP-317 pricing for the legacy transparent path — the one every Zcash send
 * takes while the `zcashShielded` feature is off, and which is priced by
 * wallet-btc's sat/vByte model rather than by the PCZT builder.
 *
 * ZIP-317 charges per *logical action* — `max(inputs, outputs)`, floored at two
 * — so the fee owed depends on a transaction's shape, not on its size. No single
 * rate per vByte can express that, and the mismatch is not academic: a rate
 * derived from the per-input cost (5000 zats over ~148 vBytes ⇒ 34 sat/vB) bills
 * 7684 zats on a one-input, two-output send, under the 10_000 floor, and the node
 * rejects it for "unpaid actions above the limit" (LIVE-35152).
 *
 * The way out is to choose the rate per transaction rather than per account.
 */

/**
 * Rate that covers ZIP-317 for *every* layout — the starting point, and the
 * fallback whenever the tighter rate cannot be established.
 *
 * The binding case is the smallest transaction that can be built, one input and
 * one output, because the two-action floor applies to it in full: 10_000 zats
 * over ~192 vBytes, so ~53 sat/vB. Every larger layout needs less, since the
 * floor stays flat while the size grows (two inputs) and beyond that the action
 * count grows more slowly than the byte count.
 */
export function zcashSafeFeePerByte(crypto: ICrypto, derivationMode: string): BigNumber {
  const smallestTxVBytes = maxTxVBytesCeil(1, [], true, crypto, derivationMode);
  return new BigNumber(Math.ceil(ZIP317_MINIMUM_FEE / Math.max(1, smallestTxVBytes)));
}

/** What a build at a given rate charges, against what ZIP-317 requires for it. */
type FeeProbe = { charged: BigNumber; required: BigNumber };

async function probeFee(
  account: Account,
  transaction: Transaction,
  feePerByte: BigNumber,
): Promise<FeeProbe | undefined> {
  try {
    const { fees, txInputs, txOutputs } = await calculateFees({
      account,
      transaction: { ...transaction, feePerByte },
    });
    if (!fees.isFinite() || fees.lte(0)) return undefined;
    return {
      charged: fees,
      required: computeZip317Fee(0, 0, txInputs.length, txOutputs.length),
    };
  } catch {
    // Not enough balance, unreachable explorer, … — getTransactionStatus runs the
    // same build and surfaces the error. Here it only means the rate cannot be
    // tightened, so the caller keeps the safe one.
    return undefined;
  }
}

/**
 * Rate that makes the per-vByte model charge the ZIP-317 fee for the layout this
 * transaction resolves to.
 *
 * The fee charged is `rate × vsize`, so the rate that would charge exactly what
 * ZIP-317 requires is `rate × required / charged`. Deriving it from what a build
 * actually charged avoids reproducing wallet-btc's sizing model here — the fee
 * stays correct even if that model changes.
 *
 * A layout is only known once the inputs are selected, and lowering the rate can
 * change that selection, so the tightened rate is confirmed by a second build and
 * abandoned if it no longer covers ZIP-317. Both builds go through the
 * `calculateFees` cache, and the status step that follows reuses the last one.
 *
 * Starting from — and falling back to — {@link zcashSafeFeePerByte} keeps "never
 * below ZIP-317" true at every step: the worst outcome is overpaying, never a
 * rejected transaction.
 */
export async function resolveZcashFeePerByte(
  account: Account,
  transaction: Transaction,
  safeFeePerByte: BigNumber,
): Promise<BigNumber> {
  const atSafeRate = await probeFee(account, transaction, safeFeePerByte);
  if (!atSafeRate) return safeFeePerByte;

  const tightened = safeFeePerByte
    .times(atSafeRate.required)
    .div(atSafeRate.charged)
    .integerValue(BigNumber.ROUND_CEIL);
  // Nothing to gain when the safe rate is already at or below what this layout owes.
  if (tightened.gte(safeFeePerByte)) return safeFeePerByte;

  const atTightenedRate = await probeFee(account, transaction, tightened);
  if (!atTightenedRate || atTightenedRate.charged.lt(atTightenedRate.required)) {
    return safeFeePerByte;
  }
  return tightened;
}
