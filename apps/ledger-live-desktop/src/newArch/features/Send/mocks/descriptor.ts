import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { SendFlowUiConfig } from "../types";

const DEFAULT_UI_CONFIG: SendFlowUiConfig = {
  hasMemo: false,
  memoType: "text",
  memoMaxLength: undefined,
  memoMaxValue: undefined,
  memoOptions: undefined,
  recipientSupportsDomain: false,
  hasFeePresets: false,
  hasCustomFees: false,
  hasCoinControl: false,
};

const FAMILY_OVERRIDES: Record<string, Partial<SendFlowUiConfig>> = {
  stellar: { hasMemo: true, memoType: "text" },
  ripple: { hasMemo: true, memoType: "number" },
  cosmos: { hasMemo: true, memoType: "text" },
  ton: { hasMemo: true, memoType: "text" },
  hedera: { hasMemo: true, memoType: "text" },
  bitcoin: { hasCoinControl: true, hasCustomFees: true },
};

/**
 * Placeholder UI config while descriptor PR is pending.
 * Once descriptors are available, replace this by the real `getSendDescriptor/sendFeatures`.
 */
export function getMockSendUiConfig(currency: CryptoOrTokenCurrency | null): SendFlowUiConfig {
  if (!currency) return DEFAULT_UI_CONFIG;
  const family =
    currency.type === "TokenCurrency" ? currency.parentCurrency.family : currency.family;
  return {
    ...DEFAULT_UI_CONFIG,
    ...(FAMILY_OVERRIDES[family] ?? {}),
  };
}
