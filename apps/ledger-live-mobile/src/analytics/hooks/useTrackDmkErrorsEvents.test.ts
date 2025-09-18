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

describe("useTrackDmkErrorsEvents", () => {
  describe.each([
    {
      expectedErrorName: "Device Connection Lost",
      errors: [
        new DeviceDisconnectedWhileSendingError(),
        new ReconnectionFailedError(),
        new DeviceDisconnectedBeforeSendingApdu(),
        new DisconnectError(),
        { _tag: "DeviceSessionNotFound" },
      ],
    },
    {
      expectedErrorName: "Connection Method",
      errors: [
        new TransportNotSupportedError(),
        new TransportAlreadyExistsError(),
        new NoTransportProvidedError(),
        new NoAccessibleDeviceError(),
        new OpeningConnectionError(),
      ],
    },
    {
      expectedErrorName: "Device Not Onboarded",
      errors: [
        new DeviceNotInitializedError(),
        {
          _tag: "DeviceNotOnboardedError",
        },
      ],
    },
    {
      expectedErrorName: "Device Locked",
      errors: [new DeviceLockedError()],
    },
    {
      expectedErrorName: "Not Enough Memory",
      errors: [new OutOfMemoryDAError()],
    },
    {
      expectedErrorName: "OS is Unsupported",
      errors: [new UnsupportedFirmwareDAError()],
    },
    {
      expectedErrorName: "Battery Error",
      errors: [
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
      errors: [
        new InvalidStatusWordError(),
        {
          _tag: "InvalidResponseFormatError",
        },
        new UnknownDAError(),
      ],
    },
    {
      expectedErrorName: "Device Not Recognized",
      errors: [
        new DeviceNotRecognizedError(),
        new DeviceAlreadyConnectedError(),
        new UnknownDeviceError(),
      ],
    },
    {
      expectedErrorName: "Communication Error",
      errors: [
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
  ])("$expectedErrorName event", ({ expectedErrorName, errors }) => {
    it.each(errors)(`should be event name ${expectedErrorName} with error %j`, error => {
      // given
      const mockedTrackScreen = jest.fn();
      // when
      useTrackDmkErrorsEvents({
        error,
        trackScreen: mockedTrackScreen,
      });
      // then
      expect(mockedTrackScreen).toHaveBeenCalledWith("Error:", expectedErrorName, {
        error: expectedErrorName,
        subError: error._tag,
      });
    });
  });

  it("should not track any event if error is not a DMK error", () => {
    // given
    const mockedTrackScreen = jest.fn();
    const error = new Error("test");
    // when
    useTrackDmkErrorsEvents({
      error,
      trackScreen: mockedTrackScreen,
    });
    // then
    expect(mockedTrackScreen).not.toHaveBeenCalled();
  });
  it("should track event if dmk error is not grouped", () => {
    // given
    const mockedTrackScreen = jest.fn();
    const error = {
      _tag: "UnregisteredDmkErrorEvent",
    };
    // when
    useTrackDmkErrorsEvents({
      error,
      trackScreen: mockedTrackScreen,
    });
    // then
    expect(mockedTrackScreen).toHaveBeenCalledWith("Error:", "UnregisteredDmkErrorEvent", {
      error: "UnregisteredDmkErrorEvent",
      subError: "UnregisteredDmkErrorEvent",
    });
  });
});
