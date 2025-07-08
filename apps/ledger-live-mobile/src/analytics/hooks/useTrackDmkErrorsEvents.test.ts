import {
  AlreadySendingApduError,
  DeviceAlreadyConnectedError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
  DeviceLockedError,
  DeviceNotInitializedError,
  DeviceNotRecognizedError,
  DisconnectError,
  InvalidStatusWordError,
  NoAccessibleDeviceError,
  NoTransportProvidedError,
  OpeningConnectionError,
  OutOfMemoryDAError,
  ReconnectionFailedError,
  SendApduTimeoutError,
  TransportAlreadyExistsError,
  TransportNotSupportedError,
  UnknownDAError,
  UnknownDeviceError,
  UnknownDeviceExchangeError,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import { useTrackDmkErrorsEvents } from "./useTrackDmkErrorsEvents";
import { useAnalytics } from "~/analytics";

describe("useTrackDmkErrorsEvents", () => {
  describe.each([
    {
      expectedErrorName: "Device Connection Lost",
      tags: [
        new DeviceDisconnectedWhileSendingError(),
        new ReconnectionFailedError(),
        new DeviceDisconnectedBeforeSendingApdu(),
        new DisconnectError(),
        { _tag: "DeviceSessionNotFound" },
      ],
    },
    {
      expectedErrorName: "Connection Method",
      tags: [
        new TransportNotSupportedError(),
        new TransportAlreadyExistsError(),
        new NoTransportProvidedError(),
        new NoAccessibleDeviceError(),
        new OpeningConnectionError(),
      ],
    },
    {
      expectedErrorName: "Device Not Onboarded",
      tags: [
        new DeviceNotInitializedError(),
        {
          _tag: "DeviceNotOnboardedError",
        },
      ],
    },
    {
      expectedErrorName: "Device Locked",
      tags: [new DeviceLockedError()],
    },
    {
      expectedErrorName: "Not Enough Memory",
      tags: [new OutOfMemoryDAError()],
    },
    {
      expectedErrorName: "OS is Unsupported",
      tags: [new UnsupportedFirmwareDAError()],
    },
    {
      expectedErrorName: "Battery Error",
      tags: [
        {
          _tag: "InvalidBatteryStatusTypeError",
        },
        {
          _tag: "InvalidBatteryDataError",
        },
      ],
    },
    {
      expectedErrorName: "Device Connection Error",
      tags: [
        new InvalidStatusWordError(),
        {
          _tag: "InvalidResponseFormatError",
        },
        new UnknownDAError(),
      ],
    },
    {
      expectedErrorName: "Device Not Recognized",
      tags: [
        new DeviceNotRecognizedError(),
        new DeviceAlreadyConnectedError(),
        new UnknownDeviceError(),
      ],
    },
    {
      expectedErrorName: "Communication Error",
      tags: [
        new AlreadySendingApduError(),
        new UnknownDeviceExchangeError(),
        new SendApduTimeoutError(),
        {
          _tag: "ReceiverApduError",
        },
        {
          _tag: "FramerApduError",
        },
      ],
    },
  ])("$expectedErrorName event", ({ expectedErrorName, tags }) => {
    it.each(tags)(`should be event name ${expectedErrorName} with error %j`, error => {
      // given
      const track = jest.fn();
      // when
      useTrackDmkErrorsEvents({
        error,
        useAnalytics: (() => ({ track })) as unknown as typeof useAnalytics,
      });
      // then
      expect(track).toHaveBeenCalledWith("DeviceErrorTracking", {
        error: expectedErrorName,
        subError: error._tag,
      });
    });
  });

  it("should not track any event if error is not a DMK error", () => {
    // given
    const track = jest.fn();
    const error = new Error("test");
    // when
    useTrackDmkErrorsEvents({
      error,
      useAnalytics: (() => ({ track })) as unknown as typeof useAnalytics,
    });
    // then
    expect(track).not.toHaveBeenCalled();
  });
});
