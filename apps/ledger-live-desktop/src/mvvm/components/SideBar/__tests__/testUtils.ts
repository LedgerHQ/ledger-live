import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");

export const defaultInitialState = {
  accounts: [genAccount("sidebar-test-btc", { currency: bitcoinCurrency })],
  settings: {
    ...INITIAL_STATE,
    hasCompletedOnboarding: true,
  },
};

export function withFeatureFlags(flags: Record<string, unknown>) {
  return {
    ...defaultInitialState,
    settings: {
      ...INITIAL_STATE,
      hasCompletedOnboarding: true,
      overriddenFeatureFlags: { ...INITIAL_STATE.overriddenFeatureFlags, ...flags },
    },
  };
}
