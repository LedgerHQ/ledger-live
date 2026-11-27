import { memoEncodedSize } from "@ledgerhq/concordium-core";
import { CONCORDIUM_ENERGY } from "../../constants";
import { getTransactionCost } from "../../network/proxyClient";
import { ConcordiumInvalidConfigError, nonNegativeInt, positiveInt } from "../../tuning";
import type { ConcordiumContext } from "../../types";

export interface FeeEstimation {
  cost: bigint;
  energy: bigint;
}

export interface PltFeeParams {
  /** Priced by its UTF-8 byte length alone, so it must be the on-chain id verbatim. */
  tokenId: string;
  /** Byte length of the CBOR operations blob, which must already be encoded. */
  listOperationsSize: number;
}

/**
 * Applies a percentage buffer to an energy figure, rounding up.
 *
 * Rounding up rather than truncating keeps a small estimate from losing its
 * buffer entirely to integer division. The cost is not buffered with this: it is
 * derived from the buffered energy instead — see {@link estimateTokenFees}.
 */
export function applyEnergyBuffer(value: bigint, bufferPercent: number): bigint {
  const scale = BigInt(100);
  return (value * (scale + BigInt(bufferPercent)) + scale - BigInt(1)) / scale;
}

export async function estimateFees(
  context: ConcordiumContext,
  memo: string | undefined,
): Promise<FeeEstimation> {
  try {
    const result = await getTransactionCost(context, {
      type: "simpleTransfer",
      numSignatures: 1,
      ...(memo ? { memoSize: memoEncodedSize(memo) } : {}),
    });

    return {
      cost: BigInt(result.cost),
      energy: BigInt(result.energy),
    };
  } catch (error) {
    // A broken coin config is not a proxy outage: a fallback fee would hide it.
    if (error instanceof ConcordiumInvalidConfigError) throw error;
    context.logger("concordium", "estimateFees error", { error });
    const config = await context.config();

    return {
      cost: BigInt(positiveInt("fees.defaultCost", config.fees?.defaultCost)),
      energy: memo ? CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX : CONCORDIUM_ENERGY.DEFAULT,
    };
  }
}

/**
 * Estimates the fee for a PLT transfer, buffered.
 *
 * Separate from {@link estimateFees} rather than a branch inside it, because the
 * CCD path's fixed-energy fallback has no PLT counterpart: the fee depends on
 * the token id's length and the blob's size, so there is no constant to
 * substitute.
 *
 * The rejection propagates through `prepareTransaction`. The send flow retries
 * that with backoff, so catching it to leave the fee unset would defeat the
 * retry, and a cleared fee reads as a blocking validation error rather than a
 * pending one. `estimateMaxSpendable` is the other caller and has no such retry,
 * so it catches on its own behalf.
 */
export async function estimateTokenFees(
  context: ConcordiumContext,
  { tokenId, listOperationsSize }: PltFeeParams,
): Promise<FeeEstimation> {
  const result = await getTransactionCost(context, {
    type: "tokenUpdate",
    numSignatures: 1,
    tokenId,
    listOperationsSize,
    tokenOperationTypeCount: { transfer: 1 },
  });

  const config = await context.config();
  const energy = BigInt(result.energy);
  const cost = BigInt(result.cost);
  const bufferPercent = nonNegativeInt(
    "fees.pltEnergyBufferPercent",
    config.fees?.pltEnergyBufferPercent,
  );
  const bufferedEnergy = applyEnergyBuffer(energy, bufferPercent);

  // The fee has to fund the buffered energy, not merely carry the same buffer.
  // The chain deposits `ceil(rate * headerEnergy)` (`Types.hs` `computeCost`) and
  // compares that against the account's available amount, so buffering cost and
  // energy independently can leave the fee a few µCCD short of the header it is
  // paired with. Scaling by the proxy's own ratio is a safe upper bound, because
  // `cost` is already `ceil(rate * energy)` and so `cost / energy >= rate`.
  const bufferedCost =
    energy === BigInt(0)
      ? applyEnergyBuffer(cost, bufferPercent)
      : (cost * bufferedEnergy + energy - BigInt(1)) / energy;

  return { cost: bufferedCost, energy: bufferedEnergy };
}
