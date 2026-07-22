import { BigNumber } from "bignumber.js";
import type { CoinDescriptor, NetworkFeesInfo } from "../../../bridge/descriptor/types";

type TronFeeStatus = {
  estimatedFees?: BigNumber;
  energyRequired?: BigNumber;
  bandwidthRequired?: BigNumber;
  errors?: Record<string, unknown>;
};

// Variant keys off `estimatedFees` (the amount the fee row shows), never a resource comparison, so
// the copy can't contradict the fee — notably inactive-recipient TRC20, which charges a flat fee
// despite ample resources. `energyRequired`/`bandwidthRequired` are the amounts consumed (0 native/TRC10).
function getNetworkFeesInfo({
  status,
}: {
  transaction: unknown;
  status: unknown;
}): NetworkFeesInfo | null {
  const s = (status ?? {}) as TronFeeStatus;
  // Require finite BigNumbers: a non-finite field is unknown, so return the generic copy to stay
  // consistent with the fee row (which shows "-") and to avoid interpolating `NaN` into the text.
  if (
    !BigNumber.isBigNumber(s.estimatedFees) ||
    !BigNumber.isBigNumber(s.energyRequired) ||
    !BigNumber.isBigNumber(s.bandwidthRequired) ||
    !s.estimatedFees.isFinite() ||
    !s.energyRequired.isFinite() ||
    !s.bandwidthRequired.isFinite()
  ) {
    return null;
  }

  const covered = s.estimatedFees.isZero();

  // While the transaction has errors, fee estimation may be skipped, leaving a defaulted 0 that is
  // unknown rather than covered. Fall back to the generic copy so it matches the fee row (which
  // shows "-" in this state) instead of asserting resources cover the fee.
  if (covered && Object.keys(s.errors ?? {}).length > 0) {
    return null;
  }

  return {
    translationKey: covered ? "tronFees.sufficient" : "tronFees.insufficient",
    values: {
      energy: s.energyRequired.toFixed(),
      bandwidth: s.bandwidthRequired.toFixed(),
    },
  };
}

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: false,
      showFeeCurrencyAmount: true,
      getNetworkFeesInfo,
    },
  },
};
