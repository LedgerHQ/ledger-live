import BigNumber from "bignumber.js";
import type { CoinDescriptor, NetworkFeesInfo } from "../../../bridge/descriptor/types";

type TronFeeStatus = {
  estimatedFees?: BigNumber;
  energyRequired?: BigNumber;
  bandwidthRequired?: BigNumber;
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
  if (
    !BigNumber.isBigNumber(s.estimatedFees) ||
    !BigNumber.isBigNumber(s.energyRequired) ||
    !BigNumber.isBigNumber(s.bandwidthRequired)
  ) {
    return null;
  }

  const covered = s.estimatedFees.isZero();

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
      getNetworkFeesInfo,
    },
  },
};
