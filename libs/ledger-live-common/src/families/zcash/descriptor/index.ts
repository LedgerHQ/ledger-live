import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { zcashBalanceTypeConfig } from "./balanceType";
import { memo } from "./memo";
import { getPrivacyAttributes } from "../tracking";

// ZIP-317 defines one conventional fee computed from the transaction's action
// layout: no presets, no custom fee, and no coin control. The fee shown is the
// bridge's `status.estimatedFees`, which the descriptor deliberately leaves alone.
export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
      hasCoinControl: false,
    },
    selfTransfer: "free",
    balanceType: zcashBalanceTypeConfig,
    // Shared with the Datadog broadcast event so Segment and Datadog can't diverge.
    getTrackingAttributes: transaction => getPrivacyAttributes(transaction) ?? {},
  },
};
