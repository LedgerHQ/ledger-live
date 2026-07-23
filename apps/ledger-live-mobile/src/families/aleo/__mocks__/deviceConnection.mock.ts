import { of } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";

export const ALEO_MOCK_DEVICE = { modelId: DeviceModelId.stax, deviceId: "mock" };
const ALEO_MOCK_APP_AND_VERSION = { name: "Aleo", version: "1.0.0" };

// hw/actions/app's real implementation requires hw/index internally, which is also mocked
// below to this same file — this must be defined first or that require re-enters this module
// before hwIndexModule exists.
export const hwIndexModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(() =>
    of({
      type: "add" as const,
      id: ALEO_MOCK_DEVICE.deviceId,
      name: "Ledger Stax",
      deviceModel: { id: ALEO_MOCK_DEVICE.modelId },
      wired: true,
    }),
  ),
};

// Every step that resolves app connection (device selection, view-key approval, transaction
// signing) goes through this same module's createAction, reporting "device connected, app open".
export const hwActionsAppModule = {
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => ({
      device: ALEO_MOCK_DEVICE,
      appAndVersion: ALEO_MOCK_APP_AND_VERSION,
      isLocked: false,
      opened: true,
      inWrongDeviceForAccount: null,
      error: null,
    }),
    mapResult: () => ({ device: ALEO_MOCK_DEVICE, appAndVersion: ALEO_MOCK_APP_AND_VERSION }),
  }),
};

export const deviceLockedPollingModule = {
  ...jest.requireActual("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling"),
  useIsDeviceLockedPolling: () => ({ result: { type: "unlocked" }, retry: jest.fn() }),
};
