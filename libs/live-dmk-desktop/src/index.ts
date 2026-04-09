export { useDeviceSessionState } from "@ledgerhq/live-dmk-shared";
export { DeviceManagementKitTransport } from "./transport/DeviceManagementKitTransport";
export {
  isAllowedOnboardingStatePollingErrorDmk,
  isDisconnectedWhileSendingApduError,
  isInvalidGetFirmwareMetadataResponseError,
  isDmkError,
} from "./errors";
export type { DmkError } from "@ledgerhq/device-management-kit";
