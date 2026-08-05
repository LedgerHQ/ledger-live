import { of } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";

export const HEDERA_MOCK_DEVICE = { modelId: DeviceModelId.stax, deviceId: "mock" };
const HEDERA_MOCK_APP_AND_VERSION = { name: "Hedera", version: "1.0.0" };

export const hwIndexModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(() =>
    of({
      type: "add" as const,
      id: HEDERA_MOCK_DEVICE.deviceId,
      name: "Ledger Stax",
      deviceModel: { id: HEDERA_MOCK_DEVICE.modelId },
      wired: true,
    }),
  ),
};

export const hwActionsAppModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => ({
      device: HEDERA_MOCK_DEVICE,
      appAndVersion: HEDERA_MOCK_APP_AND_VERSION,
      isLocked: false,
      opened: true,
      inWrongDeviceForAccount: null,
      error: null,
    }),
    mapResult: () => ({
      device: HEDERA_MOCK_DEVICE,
      appAndVersion: HEDERA_MOCK_APP_AND_VERSION,
    }),
  }),
};

export const deviceLockedPollingModule = {
  ...jest.requireActual("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling"),
  useIsDeviceLockedPolling: () => ({ result: { type: "unlocked" }, retry: jest.fn() }),
};
