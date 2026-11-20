import { cardanoDefaults, type CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { isPlainObjectOverride, LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { currencyDefaultsToLiveConfig, getCurrencyConfiguration } from "../../config";

type KeychainObservableRangeSource = () => number | undefined;

let getUserKeychainObservableRange: KeychainObservableRangeSource | undefined;

export const setCardanoKeychainObservableRangeSource = (
  source?: KeychainObservableRangeSource,
): void => {
  getUserKeychainObservableRange = source;
};

const overrideSetsKeychainObservableRange = (currencyId: string): boolean => {
  const override = LiveConfig.getOverrides()[`config_currency_${currencyId}`];
  return isPlainObjectOverride(override) && "keychainObservableRange" in override;
};

export const getCardanoCoinConfig = (currencyId: string): CardanoCoinConfig => {
  const resolvedConfig = getCurrencyConfiguration<CardanoCoinConfig>(currencyId);
  const userRange = getUserKeychainObservableRange?.();
  const userRangeApplies =
    userRange !== undefined &&
    Number.isInteger(userRange) &&
    userRange > 0 &&
    !overrideSetsKeychainObservableRange(currencyId);
  return userRangeApplies
    ? { ...resolvedConfig, keychainObservableRange: userRange }
    : resolvedConfig;
};

export const cardanoConfig = currencyDefaultsToLiveConfig(cardanoDefaults);
