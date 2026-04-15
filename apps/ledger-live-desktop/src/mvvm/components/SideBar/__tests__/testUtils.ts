import { DeviceModelId } from "@ledgerhq/devices";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const lastOnboardedDevice = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoSP,
  wired: false,
};

export const defaultInitialState = {
  accounts: [BTC_ACCOUNT],
  settings: {
    ...INITIAL_STATE,
    hasCompletedOnboarding: true,
    lastOnboardedDevice,
  },
};

export const initialStateNoOnboardedDevice = {
  ...defaultInitialState,
  settings: {
    ...defaultInitialState.settings,
    lastOnboardedDevice: null,
  },
};

export function withFeatureFlags(flags: Record<string, unknown>) {
  return {
    ...defaultInitialState,
    featureFlags: {
      ...FEATURE_FLAGS_INITIAL_STATE,
      overrides: flags,
    },
  };
}
