import {
  // Transport errors (exported)
  DeviceDisconnectedWhileSendingError,
  ReconnectionFailedError,
  DisconnectError,
  TransportNotSupportedError,
  TransportAlreadyExistsError,
  NoTransportProvidedError,
  NoAccessibleDeviceError,
  DeviceNotInitializedError,
  DeviceNotRecognizedError,
  DeviceAlreadyConnectedError,
  UnknownDeviceError,
  SendApduTimeoutError,
  AlreadySendingApduError,
  // Command errors (exported)
  InvalidStatusWordError,
  InvalidGetFirmwareMetadataResponseError,
  // Device action errors (exported)
  DeviceLockedError,
  OutOfMemoryDAError,
  UnsupportedFirmwareDAError,
  UnknownDAError,
  // Core errors (exported)
  UnknownDeviceExchangeError,
} from "@ledgerhq/device-management-kit";
import { useTrackDmkErrorsEvents } from "./useTrackDmkErrorsEvents";

// Helper to create mock DMK errors for error classes not exported from the package
const createMockDmkError = (tag: string, message = "Mock error message") => ({
  _tag: tag,
  message,
  originalError: undefined,
});

describe("useTrackDmkErrorsEvents", () => {
  describe("should not track non-DMK errors", () => {
    it("does not track regular Error instances", () => {
      const mockTrack = jest.fn();
      useTrackDmkErrorsEvents({ error: new Error("regular error"), track: mockTrack });
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("does not track null", () => {
      const mockTrack = jest.fn();
      useTrackDmkErrorsEvents({ error: null, track: mockTrack });
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("does not track undefined", () => {
      const mockTrack = jest.fn();
      useTrackDmkErrorsEvents({ error: undefined, track: mockTrack });
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("does not track string errors", () => {
      const mockTrack = jest.fn();
      useTrackDmkErrorsEvents({ error: "string error", track: mockTrack });
      expect(mockTrack).not.toHaveBeenCalled();
    });
  });

  describe("should track DMK errors with correct properties", () => {
    it("includes all expected properties for a grouped error", () => {
      const mockTrack = jest.fn();
      const error = new DeviceDisconnectedWhileSendingError();

      useTrackDmkErrorsEvents({ error, track: mockTrack });

      expect(mockTrack).toHaveBeenCalledWith(
        "Error:",
        "Device Connection Lost",
        expect.objectContaining({
          subError: "DeviceDisconnectedWhileSendingError",
          subErrorJSON: expect.any(String),
          error: "Device Connection Lost",
        }),
      );
    });

    it("handles undefined originalError gracefully", () => {
      const mockTrack = jest.fn();
      const error = new DeviceLockedError();

      useTrackDmkErrorsEvents({ error, track: mockTrack });

      expect(mockTrack).toHaveBeenCalledWith(
        "Error:",
        "Device Locked",
        expect.objectContaining({
          subError: "DeviceLockedError",
          error: "Device Locked",
        }),
      );
    });
  });

  describe("error grouping for all categories", () => {
    // Tests using actual exported DMK error classes
    const exportedErrorTests = [
      {
        group: "Device Connection Lost",
        errors: [
          { error: new DeviceDisconnectedWhileSendingError(), tag: "DeviceDisconnectedWhileSendingError" },
          { error: new ReconnectionFailedError(), tag: "ReconnectionFailedError" },
          { error: new DisconnectError(), tag: "DisconnectError" },
        ],
      },
      {
        group: "Connection Method",
        errors: [
          { error: new TransportNotSupportedError(), tag: "TransportNotSupportedError" },
          { error: new TransportAlreadyExistsError(), tag: "TransportAlreadyExistsError" },
          { error: new NoTransportProvidedError(), tag: "NoTransportProvidedError" },
          { error: new NoAccessibleDeviceError(), tag: "NoAccessibleDeviceError" },
        ],
      },
      {
        group: "Device Not Onboarded",
        errors: [{ error: new DeviceNotInitializedError(), tag: "DeviceNotInitializedError" }],
      },
      {
        group: "Device Locked",
        errors: [{ error: new DeviceLockedError(), tag: "DeviceLockedError" }],
      },
      {
        group: "Not Enough Memory",
        errors: [{ error: new OutOfMemoryDAError(), tag: "OutOfMemoryDAError" }],
      },
      {
        group: "OS is Unsupported",
        errors: [{ error: new UnsupportedFirmwareDAError(), tag: "UnsupportedFirmwareDAError" }],
      },
      {
        group: "Device Connection Error",
        errors: [
          { error: new InvalidStatusWordError(), tag: "InvalidStatusWordError" },
          { error: new UnknownDAError(), tag: "UnknownDAError" },
        ],
      },
      {
        group: "Device Not Recognized",
        errors: [
          { error: new DeviceNotRecognizedError(), tag: "DeviceNotRecognizedError" },
          { error: new DeviceAlreadyConnectedError(), tag: "DeviceAlreadyDiscoveredError" },
          { error: new UnknownDeviceError(), tag: "UnknownDeviceError" },
        ],
      },
      {
        group: "Communication Error",
        errors: [
          { error: new SendApduTimeoutError(), tag: "SendApduTimeoutError" },
          { error: new AlreadySendingApduError(), tag: "AlreadySendingApduError" },
          { error: new UnknownDeviceExchangeError(), tag: "UnknownDeviceExchangeError" },
        ],
      },
      {
        group: "Invalid Provider",
        errors: [
          {
            error: new InvalidGetFirmwareMetadataResponseError(),
            tag: "InvalidGetFirmwareMetadataResponseError",
          },
        ],
      },
    ];

    // Tests using mocks for error classes not exported from the package
    const mockErrorTests = [
      {
        group: "Device Connection Lost",
        errors: [
          { tag: "DeviceDisconnectedBeforeSendingApdu" },
          { tag: "DeviceSessionNotFound" },
        ],
      },
      {
        group: "Connection Method",
        errors: [{ tag: "ConnectionOpeningError" }],
      },
      {
        group: "Device Not Onboarded",
        errors: [{ tag: "DeviceNotOnboardedError" }],
      },
      {
        group: "Battery Error",
        errors: [{ tag: "InvalidBatteryStatusTypeError" }, { tag: "InvalidBatteryDataError" }],
      },
      {
        group: "Device Connection Error",
        errors: [{ tag: "InvalidResponseFormatError" }],
      },
      {
        group: "Communication Error",
        errors: [{ tag: "ReceiverApduError" }, { tag: "FramerApduError" }],
      },
    ];

    describe("with actual DMK error instances", () => {
      exportedErrorTests.forEach(({ group, errors }) => {
        describe(`"${group}" group`, () => {
          errors.forEach(({ error, tag }) => {
            it(`maps ${tag} to "${group}"`, () => {
              const mockTrack = jest.fn();

              useTrackDmkErrorsEvents({ error, track: mockTrack });

              expect(mockTrack).toHaveBeenCalledWith(
                "Error:",
                group,
                expect.objectContaining({
                  subError: tag,
                  error: group,
                }),
              );
            });
          });
        });
      });
    });

    describe("with mock DMK errors (for non-exported error classes)", () => {
      mockErrorTests.forEach(({ group, errors }) => {
        describe(`"${group}" group`, () => {
          errors.forEach(({ tag }) => {
            it(`maps ${tag} to "${group}"`, () => {
              const mockTrack = jest.fn();
              const error = createMockDmkError(tag);

              useTrackDmkErrorsEvents({ error, track: mockTrack });

              expect(mockTrack).toHaveBeenCalledWith(
                "Error:",
                group,
                expect.objectContaining({
                  subError: tag,
                  error: group,
                }),
              );
            });
          });
        });
      });
    });

    it("uses _tag directly for ungrouped errors", () => {
      const mockTrack = jest.fn();
      const error = createMockDmkError("SomeUnknownError", "Unknown error message");

      useTrackDmkErrorsEvents({ error, track: mockTrack });

      expect(mockTrack).toHaveBeenCalledWith(
        "Error:",
        "SomeUnknownError",
        expect.objectContaining({
          subError: "SomeUnknownError",
          error: "SomeUnknownError",
        }),
      );
    });
  });
});
