import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
  FirmwareUpdateContext,
} from "@ledgerhq/device-management-kit";

export type DeviceOnboardingSession = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  deviceModelId: DeviceModelId;
};

type FirmwareCatalogueUpdate = NonNullable<FirmwareUpdateContext["availableUpdate"]>;

/** The app opens and closes the session. The machine reads the current id and asks for the firmware catalogue. */
export type DeviceOnboardingPorts = {
  openSession(): Promise<DeviceOnboardingSession>;
  currentSessionId(): DeviceSessionId;
  closeSession(): Promise<void>;
  /** `null` means the installed firmware is already the latest. */
  lookupFirmwareUpdate(): Promise<FirmwareCatalogueUpdate | null>;
};
