import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getSendDescriptor } from "../../bridge/descriptor/registry";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import type { SendFlowUiConfig } from "./types";

export const DEFAULT_SEND_UI_CONFIG: SendFlowUiConfig = {
  hasMemo: false,
  memoType: undefined,
  memoMaxLength: undefined,
  memoMaxValue: undefined,
  memoOptions: undefined,
  recipientSupportsDomain: false,
  hasFeePresets: false,
  hasCustomFees: false,
  hasCoinControl: false,
  hasDefaultStrategy: false,
};

/**
 * `recipient` is the address the flow currently points at, needed because a coin can
 * restrict its memo to some recipients (see `InputDescriptor.appliesToRecipient`).
 * `hasMemo` therefore answers "show the memo input for this recipient", not "this coin
 * knows about memos" -- callers wanting the latter should read the descriptor.
 */
export function getSendUiConfig(
  currency: CryptoOrTokenCurrency | null,
  recipient: string = "",
): SendFlowUiConfig {
  if (!currency) return DEFAULT_SEND_UI_CONFIG;
  const descriptor = getSendDescriptor(currency);

  if (!descriptor) {
    return DEFAULT_SEND_UI_CONFIG;
  }

  const memoDescriptor = descriptor.inputs.memo;

  return {
    hasMemo: sendFeatures.hasMemoForRecipient(currency, recipient),
    memoType: memoDescriptor?.type,
    memoMaxLength: sendFeatures.getMemoMaxLength(currency),
    memoMaxValue: sendFeatures.getMemoMaxValue(currency),
    memoOptions: sendFeatures.getMemoOptions(currency),
    recipientSupportsDomain: sendFeatures.supportsDomain(currency),
    hasFeePresets: sendFeatures.hasFeePresets(currency),
    hasCustomFees: sendFeatures.hasCustomFees(currency),
    hasCoinControl: sendFeatures.hasCoinControl(currency),
    hasDefaultStrategy: sendFeatures.hasDefaultStrategy(currency),
  };
}
