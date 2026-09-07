import { BigNumber } from "bignumber.js";
import type { CoinDescriptor, NetworkFeesInfo } from "../../../bridge/descriptor/types";

type TronFeeStatus = {
  estimatedFees?: BigNumber;
  errors?: Record<string, unknown>;
};

/**
 * The energy/bandwidth amounts a Tron transaction consumes, as reported by `coin-tron`'s
 * `estimateFees` through `FeeEstimation.parameters` and propagated onto the transaction's
 * `feeParameters` by the generic `prepareTransaction`. Plain integer strings, as coin-tron sends them.
 */
type TronResourceBreakdown = {
  energyRequired?: string;
  bandwidthRequired?: string;
};

function toFiniteAmount(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const parsed = new BigNumber(value);
  return parsed.isFinite() ? parsed.toFixed() : undefined;
}

// Variant keys off `estimatedFees` (the amount the fee row shows), never a resource comparison, so
// the copy can't contradict the fee — notably inactive-recipient TRC20, which charges a flat fee
// despite ample resources. `energyRequired`/`bandwidthRequired` are the amounts consumed (0 native/TRC10).
function getNetworkFeesInfo({
  transaction,
  status,
}: {
  transaction: unknown;
  status: unknown;
}): NetworkFeesInfo | null {
  const s = (status ?? {}) as TronFeeStatus;
  const breakdown = ((transaction as { feeParameters?: TronResourceBreakdown } | null)
    ?.feeParameters ?? {}) as TronResourceBreakdown;

  const energy = toFiniteAmount(breakdown.energyRequired);
  const bandwidth = toFiniteAmount(breakdown.bandwidthRequired);

  // Require a finite fee and both resource amounts: anything missing is unknown, so return the
  // generic copy to stay consistent with the fee row (which shows "-") rather than interpolating
  // `NaN` into the text.
  if (
    !BigNumber.isBigNumber(s.estimatedFees) ||
    !s.estimatedFees.isFinite() ||
    energy === undefined ||
    bandwidth === undefined
  ) {
    return null;
  }

  const covered = s.estimatedFees.isZero();

  // While the transaction has errors, fee estimation is skipped, leaving a defaulted 0 that is
  // unknown rather than covered. Fall back to the generic copy so it matches the fee row (which
  // shows "-" in this state) instead of asserting resources cover the fee.
  if (covered && Object.keys(s.errors ?? {}).length > 0) {
    return null;
  }

  return {
    translationKey: covered ? "tronFees.sufficient" : "tronFees.insufficient",
    values: { energy, bandwidth },
  };
}

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: false,
      getNetworkFeesInfo,
    },
  },
};
