import { screen } from "../segment";
import { isDmkError } from "@ledgerhq/live-dmk-mobile";

const ErrorEvents = [
  {
    name: "Device Connection Lost",
    tags: [
      "DeviceDisconnectedWhileSendingError",
      "ReconnectionFailedError",
      "DeviceDisconnectedBeforeSendingApdu",
      "DisconnectError",
      "DeviceSessionNotFound",
    ],
  },
  {
    name: "Connection Method",
    tags: [
      "TransportNotSupportedError",
      "TransportAlreadyExistsError",
      "NoTransportProvidedError",
      "NoAccessibleDeviceError",
      "ConnectionOpeningError",
    ],
  },
  {
    name: "Device Not Onboarded",
    tags: ["DeviceNotInitializedError", "DeviceNotOnboardedError"],
  },
  {
    name: "Device Locked",
    tags: ["DeviceLockedError"],
  },
  {
    name: "Not Enough Memory",
    tags: ["OutOfMemoryDAError"],
  },
  {
    name: "OS is Unsupported",
    tags: ["UnsupportedFirmwareDAError"],
  },
  {
    name: "Battery Error",
    tags: ["InvalidBatteryStatusTypeError", "InvalidBatteryDataError"],
  },
  {
    name: "Device Connection Error",
    tags: ["InvalidStatusWordError", "InvalidResponseFormatError", "UnknownDAError"],
  },
  {
    name: "Device Not Recognized",
    tags: ["DeviceNotRecognizedError", "DeviceAlreadyDiscoveredError", "UnknownDeviceError"],
  },
  {
    name: "Communication Error",
    tags: [
      "ReceiverApduError",
      "FramerApduError",
      "SendApduTimeoutError",
      "AlreadySendingApduError",
      "UnknownDeviceExchangeError",
    ],
  },
  {
    name: "Invalid Provider",
    tags: ["InvalidGetFirmwareMetadataResponseError"],
  },
];

export const useTrackDmkErrorsEvents = ({
  error,
  trackScreen = screen,
}: {
  error: unknown;
  trackScreen?: typeof screen;
}) => {
  if (!isDmkError(error)) {
    return;
  }
  const properties = { subError: error._tag };
  const groupedError = ErrorEvents.find(({ tags }) => tags.includes(error._tag));

  trackScreen("Error:", groupedError ? groupedError.name : error._tag, {
    ...properties,
    error: groupedError ? groupedError.name : error._tag,
  });
};
