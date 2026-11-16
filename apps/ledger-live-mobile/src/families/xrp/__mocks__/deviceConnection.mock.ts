import { of } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";

const XRP_MOCK_DEVICE = { modelId: DeviceModelId.stax, deviceId: "mock" };
const XRP_MOCK_APP_AND_VERSION = { name: "XRP", version: "1.0.0" };

export const hwIndexModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(() =>
    of({
      type: "add" as const,
      id: XRP_MOCK_DEVICE.deviceId,
      name: "Ledger Stax",
      deviceModel: { id: XRP_MOCK_DEVICE.modelId },
      wired: true,
    }),
  ),
};

export const hwActionsAppModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => ({
      device: XRP_MOCK_DEVICE,
      appAndVersion: XRP_MOCK_APP_AND_VERSION,
      isLocked: false,
      opened: true,
      inWrongDeviceForAccount: null,
      error: null,
    }),
    mapResult: () => ({
      device: XRP_MOCK_DEVICE,
      appAndVersion: XRP_MOCK_APP_AND_VERSION,
    }),
  }),
};

export const deviceLockedPollingModule = {
  ...jest.requireActual("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling"),
  useIsDeviceLockedPolling: () => ({ result: { type: "unlocked" }, retry: jest.fn() }),
};
