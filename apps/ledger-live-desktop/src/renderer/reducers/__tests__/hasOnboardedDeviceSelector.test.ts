import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo, DeviceModelInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { hasOnboardedDeviceSelector, INITIAL_STATE } from "../settings";
import type { State } from "../index";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const VALID_LAST_SEEN_DEVICE: DeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  deviceInfo: {} as DeviceInfo,
  apps: [],
};

const VALID_ONBOARDED_DEVICE: Device = {
  deviceId: "test-device-id",
  modelId: DeviceModelId.stax,
  wired: true,
};

const createState = ({
  lastSeenDevice = undefined,
  lastOnboardedDevice = null,
}: {
  lastSeenDevice?: DeviceModelInfo | null;
  lastOnboardedDevice?: Device | null;
} = {}) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    settings: {
      ...INITIAL_STATE,
      lastSeenDevice,
      lastOnboardedDevice,
    },
  }) as unknown as State;

describe("hasOnboardedDeviceSelector", () => {
  it("should return false when both lastOnboardedDevice and lastSeenDevice are null/undefined", () => {
    expect(hasOnboardedDeviceSelector(createState())).toBe(false);
    expect(
      hasOnboardedDeviceSelector(createState({ lastSeenDevice: null, lastOnboardedDevice: null })),
    ).toBe(false);
  });

  it("should return true when only lastOnboardedDevice is set", () => {
    expect(
      hasOnboardedDeviceSelector(
        createState({ lastOnboardedDevice: VALID_ONBOARDED_DEVICE, lastSeenDevice: null }),
      ),
    ).toBe(true);
  });

  it("should return true when only lastSeenDevice is set (backward compat)", () => {
    expect(
      hasOnboardedDeviceSelector(
        createState({ lastSeenDevice: VALID_LAST_SEEN_DEVICE, lastOnboardedDevice: null }),
      ),
    ).toBe(true);
  });

  it("should return true when both lastOnboardedDevice and lastSeenDevice are set", () => {
    expect(
      hasOnboardedDeviceSelector(
        createState({
          lastOnboardedDevice: VALID_ONBOARDED_DEVICE,
          lastSeenDevice: VALID_LAST_SEEN_DEVICE,
        }),
      ),
    ).toBe(true);
  });

  it("should return false when lastSeenDevice has an unrecognized modelId and lastOnboardedDevice is null", () => {
    const invalidDevice: DeviceModelInfo = {
      ...VALID_LAST_SEEN_DEVICE,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      modelId: "unknownModel" as DeviceModelId,
    };
    expect(
      hasOnboardedDeviceSelector(
        createState({ lastSeenDevice: invalidDevice, lastOnboardedDevice: null }),
      ),
    ).toBe(false);
  });
});
