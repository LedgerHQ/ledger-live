import { DeviceModelId } from "@ledgerhq/devices";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";
import type { SettingsState, State } from "~/reducers/types";
import { hasOnboardedWithDeviceSelector } from "../hasOnboardedWithDevice";

const stateWith = (settings: Partial<SettingsState>): State => ({
  ...({} as State),
  settings: {
    ...SETTINGS_INITIAL_STATE,
    hasCompletedOnboarding: true,
    readOnlyModeEnabled: true,
    seenDevices: [],
    lastConnectedDevice: null,
    ...settings,
  },
});

describe("hasOnboardedWithDeviceSelector", () => {
  it("is false for an onboarded user who never used a device", () => {
    expect(hasOnboardedWithDeviceSelector(stateWith({}))).toBe(false);
  });

  it("is false when only read-only mode was turned off, as after a Ledger Sync activation", () => {
    expect(hasOnboardedWithDeviceSelector(stateWith({ readOnlyModeEnabled: false }))).toBe(false);
  });

  it("is true when a device was seen", () => {
    const seenDevice = {
      modelId: DeviceModelId.nanoX,
      deviceInfo: aDeviceInfoBuilder(),
      apps: [],
    };

    expect(hasOnboardedWithDeviceSelector(stateWith({ seenDevices: [seenDevice] }))).toBe(true);
  });

  it("is true when a device was connected", () => {
    const lastConnectedDevice = {
      deviceId: "device-id",
      deviceName: "Ledger Flex",
      modelId: DeviceModelId.europa,
      wired: false,
    };

    expect(hasOnboardedWithDeviceSelector(stateWith({ lastConnectedDevice }))).toBe(true);
  });

  it("is false before onboarding is completed, even with a device", () => {
    expect(
      hasOnboardedWithDeviceSelector(
        stateWith({
          hasCompletedOnboarding: false,
          lastConnectedDevice: {
            deviceId: "device-id",
            deviceName: "Ledger Flex",
            modelId: DeviceModelId.europa,
            wired: false,
          },
        }),
      ),
    ).toBe(false);
  });
});
