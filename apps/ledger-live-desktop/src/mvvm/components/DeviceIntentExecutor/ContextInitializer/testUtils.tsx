import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { webHidTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { InitializationInput } from "../types";
import type { InitializerDevice } from "./types";

export const connectionResult = {
  compatDeviceId: "device-id",
  compatDeviceName: "Ledger Nano X",
  compatDeviceWired: true,
  connectedDevice: {
    id: "device-id",
    name: "Ledger Nano X",
    modelId: ledgerToDmkDeviceIdMap[DeviceModelId.nanoX],
    sessionId: "session-1",
    type: "USB",
    transport: webHidTransportIdentifier,
  },
  dmk: { id: "dmk" },
  sessionId: "session-1",
} as unknown as DeviceConnectionResult;

export const deviceInitializationInput: InitializationInput = {
  appName: "Ethereum",
  dependencies: ["1inch"],
  requireLatestFirmware: false,
};

export const initializerDevice: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.nanoX,
  name: "Ledger Nano X",
  productName: "Ledger Nano X",
  wired: true,
};
