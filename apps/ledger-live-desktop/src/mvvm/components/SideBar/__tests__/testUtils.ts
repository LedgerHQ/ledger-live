import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const lastSeenDevice = {
  modelId: DeviceModelId.nanoX,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  deviceInfo: {} as DeviceInfo,
  apps: [],
};

export const defaultInitialState = {
  accounts: [BTC_ACCOUNT],
  settings: {
    ...INITIAL_STATE,
    hasCompletedOnboarding: true,
    lastSeenDevice,
  },
};

export function withFeatureFlags(flags: Record<string, unknown>) {
  return {
    ...defaultInitialState,
    settings: {
      ...INITIAL_STATE,
      hasCompletedOnboarding: true,
      lastSeenDevice,
      overriddenFeatureFlags: { ...INITIAL_STATE.overriddenFeatureFlags, ...flags },
    },
  };
}
