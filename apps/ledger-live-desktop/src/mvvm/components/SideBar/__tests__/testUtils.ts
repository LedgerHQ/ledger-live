import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

export const defaultInitialState = {
  accounts: [BTC_ACCOUNT],
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
