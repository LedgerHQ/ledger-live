import { isDmkError } from "@ledgerhq/live-dmk-desktop";
import { useTrack } from "~/renderer/analytics/segment";

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
];

export const useTrackDmkErrorsEvents = ({
  error,
  useTrack: useTrackHook = useTrack,
}: {
  error: unknown;
  useTrack?: typeof useTrack;
}) => {
  const track = useTrackHook();

  if (!isDmkError(error)) {
    return;
  }
  const properties = { subError: error._tag };

  const groupedError = ErrorEvents.find(({ tags }) => tags.includes(error._tag));

  track("DeviceErrorTracking", {
    ...properties,
    error: groupedError ? groupedError.name : error._tag,
  });
};
