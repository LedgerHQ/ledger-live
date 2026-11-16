import { DeviceModelId } from "@ledgerhq/devices";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import type { State } from "~/renderer/reducers";
import {
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  type SettingsState,
} from "~/renderer/reducers/settings";
import { hasOnboardedWithDeviceSelector } from "../hasOnboardedWithDevice";

const stateWith = (settings: Partial<SettingsState>): State =>
  ({
    settings: {
      ...SETTINGS_INITIAL_STATE,
      hasCompletedOnboarding: true,
      lastSeenDevice: null,
      lastOnboardedDevice: null,
      ...settings,
    },
  }) as State;

const lastSeenDevice = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: aDeviceInfoBuilder(),
  apps: [],
};

const lastOnboardedDevice = {
  deviceId: "device-id",
  deviceName: "Ledger Flex",
  modelId: DeviceModelId.europa,
  wired: false,
};

describe("hasOnboardedWithDeviceSelector", () => {
  it("is false for an onboarded user who never used a device", () => {
    expect(hasOnboardedWithDeviceSelector(stateWith({}))).toBe(false);
  });

  it("is true when a device was seen", () => {
    expect(hasOnboardedWithDeviceSelector(stateWith({ lastSeenDevice }))).toBe(true);
  });

  it("is true when a device went through onboarding", () => {
    expect(hasOnboardedWithDeviceSelector(stateWith({ lastOnboardedDevice }))).toBe(true);
  });

  it("is false before onboarding is completed, even with a device", () => {
    expect(
      hasOnboardedWithDeviceSelector(stateWith({ hasCompletedOnboarding: false, lastSeenDevice })),
    ).toBe(false);
  });
});
