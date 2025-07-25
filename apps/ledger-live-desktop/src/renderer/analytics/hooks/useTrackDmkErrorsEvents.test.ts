import { useTrackDmkErrorsEvents } from "./useTrackDmkErrorsEvents";
import { trackPage } from "~/renderer/analytics/segment";

describe("useTrackDmkErrorsEvents", () => {
  describe.each([
    {
      expectedErrorName: "Device Connection Lost",
      errors: [
        { _tag: "DeviceDisconnectedWhileSendingError" },
        { _tag: "ReconnectionFailedError" },
        { _tag: "DeviceDisconnectedBeforeSendingApdu" },
        { _tag: "DisconnectError" },
        { _tag: "DeviceSessionNotFound" },
      ],
    },
    {
      expectedErrorName: "Connection Method",
      errors: [
        { _tag: "TransportNotSupportedError" },
        { _tag: "TransportAlreadyExistsError" },
        { _tag: "NoTransportProvidedError" },
        { _tag: "NoAccessibleDeviceError" },
        { _tag: "ConnectionOpeningError" },
      ],
    },
    {
      expectedErrorName: "Device Not Onboarded",
      errors: [
        {
          _tag: "DeviceNotInitializedError",
        },
        {
          _tag: "DeviceNotOnboardedError",
        },
      ],
    },
    {
      expectedErrorName: "Device Locked",
      errors: [
        {
          _tag: "DeviceLockedError",
        },
      ],
    },
    {
      expectedErrorName: "Not Enough Memory",
      errors: [
        {
          _tag: "OutOfMemoryDAError",
        },
      ],
    },
    {
      expectedErrorName: "OS is Unsupported",
      errors: [
        {
          _tag: "UnsupportedFirmwareDAError",
        },
      ],
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
        {
          _tag: "InvalidStatusWordError",
        },
        {
          _tag: "InvalidResponseFormatError",
        },
        {
          _tag: "UnknownDAError",
        },
      ],
    },
    {
      expectedErrorName: "Device Not Recognized",
      errors: [
        {
          _tag: "DeviceNotRecognizedError",
        },
        {
          _tag: "DeviceAlreadyDiscoveredError",
        },
        {
          _tag: "UnknownDeviceError",
        },
      ],
    },
    {
      expectedErrorName: "Communication Error",
      errors: [
        {
          _tag: "ReceiverApduError",
        },
        {
          _tag: "FramerApduError",
        },
        {
          _tag: "SendApduTimeoutError",
        },
        {
          _tag: "AlreadySendingApduError",
        },
        {
          _tag: "UnknownDeviceExchangeError",
        },
      ],
    },
  ])("$expectedErrorName event", ({ expectedErrorName, errors }) => {
    it.each(errors)(`should be event name ${expectedErrorName} with error %j`, error => {
      // given
      const mockedTrackPage = jest.fn();
      // when
      useTrackDmkErrorsEvents({
        error,
        trackPage: mockedTrackPage,
      });
      // then
      expect(mockedTrackPage).toHaveBeenCalledWith("DeviceErrorTracking", undefined, {
        error: expectedErrorName,
        subError: error._tag,
      });
    });
  });

  it("should not track any event if error is not a DMK error", () => {
    // given
    const mockedTrackPage = jest.fn();
    const error = new Error("test");
    // when
    useTrackDmkErrorsEvents({
      error,
      trackPage: mockedTrackPage,
    });
    // then
    expect(mockedTrackPage).not.toHaveBeenCalled();
  });
  it("should track event if dmk error is not grouped", () => {
    // given
    const mockedTrackPage = jest.fn();
    const error = {
      _tag: "UnregisteredDmkErrorEvent",
    };
    // when
    useTrackDmkErrorsEvents({
      error,
      trackPage: mockedTrackPage,
    });
    // then
    expect(mockedTrackPage).toHaveBeenCalledWith("DeviceErrorTracking", undefined, {
      error: "UnregisteredDmkErrorEvent",
      subError: "UnregisteredDmkErrorEvent",
    });
  });
});
