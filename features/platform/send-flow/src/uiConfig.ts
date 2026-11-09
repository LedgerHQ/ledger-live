import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { SendFeatures } from "./descriptor/features";
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
  hasBalanceTypeStep: false,
  hasFiatAmountInput: true,
};

function isTestnetCurrency(currency: CryptoOrTokenCurrency): boolean {
  const mainCurrency =
    currency.type === "TokenCurrency"
      ? findCryptoCurrencyById(currency.parentCurrencyId)
      : currency;
  return Boolean(mainCurrency?.isTestnetFor);
}

export function getSendUiConfig(
  sendFeatures: SendFeatures,
  currency: CryptoOrTokenCurrency | null,
): SendFlowUiConfig {
  if (!currency) return DEFAULT_SEND_UI_CONFIG;
  const hasFiatAmountInput = !isTestnetCurrency(currency);

  if (!sendFeatures.hasDescriptor(currency)) {
    return { ...DEFAULT_SEND_UI_CONFIG, hasFiatAmountInput };
  }

  return {
    hasMemo: sendFeatures.hasMemo(currency),
    memoType: sendFeatures.getMemoType(currency),
    memoMaxLength: sendFeatures.getMemoMaxLength(currency),
    memoMaxValue: sendFeatures.getMemoMaxValue(currency),
    memoOptions: sendFeatures.getMemoOptions(currency),
    recipientSupportsDomain: sendFeatures.supportsDomain(currency),
    hasFeePresets: sendFeatures.hasFeePresets(currency),
    hasCustomFees: sendFeatures.hasCustomFees(currency),
    hasCoinControl: sendFeatures.hasCoinControl(currency),
    hasDefaultStrategy: sendFeatures.hasDefaultStrategy(currency),
    hasBalanceTypeStep: sendFeatures.hasBalanceTypeStep(currency),
    hasFiatAmountInput,
  };
}
