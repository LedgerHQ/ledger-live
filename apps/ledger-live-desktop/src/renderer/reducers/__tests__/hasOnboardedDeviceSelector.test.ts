import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo, DeviceModelInfo } from "@ledgerhq/types-live";
import { hasOnboardedDeviceSelector } from "../settings";
import { INITIAL_STATE } from "../settings";
import type { State } from "../index";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const VALID_DEVICE: DeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  deviceInfo: {} as DeviceInfo,
  apps: [],
};

const createState = (lastSeenDevice: DeviceModelInfo | null | undefined) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    settings: {
      ...INITIAL_STATE,
      lastSeenDevice,
    },
  }) as unknown as State;

describe("hasOnboardedDeviceSelector", () => {
  it("should return false when lastSeenDevice is null", () => {
    expect(hasOnboardedDeviceSelector(createState(null))).toBe(false);
  });

  it("should return true when lastSeenDevice is set with a valid modelId", () => {
    expect(hasOnboardedDeviceSelector(createState(VALID_DEVICE))).toBe(true);
  });

  it("should return false when lastSeenDevice is undefined", () => {
    expect(hasOnboardedDeviceSelector(createState(undefined))).toBe(false);
  });

  it("should return false when lastSeenDevice has an unrecognized modelId", () => {
    const invalidDevice: DeviceModelInfo = {
      ...VALID_DEVICE,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      modelId: "unknownModel" as DeviceModelId,
    };
    expect(hasOnboardedDeviceSelector(createState(invalidDevice))).toBe(false);
  });
});
