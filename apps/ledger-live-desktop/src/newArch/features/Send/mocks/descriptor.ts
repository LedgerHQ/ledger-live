import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getSendDescriptor, sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { SendFlowUiConfig } from "../types";

const DEFAULT_UI_CONFIG: SendFlowUiConfig = {
  hasMemo: false,
  memoType: undefined,
  memoMaxLength: undefined,
  memoMaxValue: undefined,
  memoOptions: undefined,
  recipientSupportsDomain: false,
  hasFeePresets: false,
  hasCustomFees: false,
  hasCoinControl: false,
};

/**
 * Get UI configuration for the Send flow based on the currency descriptor.
 */
export function getSendUiConfig(currency: CryptoOrTokenCurrency | null): SendFlowUiConfig {
  if (!currency) return DEFAULT_UI_CONFIG;
  const descriptor = getSendDescriptor(currency);

  if (!descriptor) {
    return DEFAULT_UI_CONFIG;
  }

  const memoDescriptor = descriptor.inputs.memo;

  return {
    hasMemo: sendFeatures.hasMemo(currency),
    memoType: memoDescriptor?.type,
    memoMaxLength: sendFeatures.getMemoMaxLength(currency),
    memoMaxValue: sendFeatures.getMemoMaxValue(currency),
    memoOptions: sendFeatures.getMemoOptions(currency),
    recipientSupportsDomain: sendFeatures.supportsDomain(currency),
    hasFeePresets: sendFeatures.hasFeePresets(currency),
    hasCustomFees: sendFeatures.hasCustomFees(currency),
    hasCoinControl: sendFeatures.hasCoinControl(currency),
  };
}
