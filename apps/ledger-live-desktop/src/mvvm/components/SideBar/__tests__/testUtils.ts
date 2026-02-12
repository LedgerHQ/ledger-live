import { INITIAL_STATE } from "~/renderer/reducers/settings";

export const defaultInitialState = {
  settings: {
    ...INITIAL_STATE,
    hasCompletedOnboarding: true,
  },
};

export function withFeatureFlags(flags: Record<string, unknown>) {
  return {
    settings: {
      ...INITIAL_STATE,
      hasCompletedOnboarding: true,
      overriddenFeatureFlags: { ...INITIAL_STATE.overriddenFeatureFlags, ...flags },
    },
  };
}
