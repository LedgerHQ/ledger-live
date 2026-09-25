import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { BaseDiscoveryErrorTypes, ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import {
  BlockingStateType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  setDeviceFlowFailure,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { resetTrackingPages, setTrackingSource } from "~/analytics/screenRefs";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  getTrackingTransport,
  PAGE_CONNECT_APP,
  PAGE_DEVICE_ACTION,
  recordConnectDeviceFailure,
  recordEnsureAppReadyFailure,
  recordExecutorStateFailure,
  trackDeviceActionButtonClicked,
  trackConnectAppButtonClicked,
  trackConnectDeviceButtonClicked,
  trackAppReady,
  trackDeviceConnected,
  trackDeviceConnecting,
  trackDeviceSelected,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowStarted,
  trackDevicePrompted,
  trackDrawerCloseButtonClicked,
} from "./trackDeviceIntent";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    track: jest.fn(),
  };
});

const mockedTrack = jest.mocked(track);
const TEST_BLE_TRANSPORT: TransportIdentifier = "RN_BLE";
const connectedDevice: ConnectedDevice = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: DMKDeviceModelId.STAX,
  sessionId: "session-id",
  type: "BLE",
  transport: "ble",
};

const layerABaseProperties = {
  deviceUxV2: true,
};

describe("trackDeviceIntent — Layer A tracking helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDeviceFlowFailure(null);
    setTrackingSource("Connect Device - Connecting");
  });

  afterEach(resetTrackingPages);

  describe("trackDeviceflowStarted", () => {
    describe("Given a sourceFlow", () => {
      describe("When called", () => {
        it("Then tracks deviceflow_started with the Layer A base properties", () => {
          trackDeviceflowStarted({ sourceFlow: "swap", extraProperties: {} });

          expect(mockedTrack).toHaveBeenCalledTimes(1);
          expect(mockedTrack).toHaveBeenCalledWith("deviceflow_started", {
            ...layerABaseProperties,
            sourceFlow: "swap",
          });
        });
      });
    });
  });

  describe("trackDevicePrompted", () => {
    describe("Given a sourceFlow", () => {
      describe("When called", () => {
        it("Then tracks device_prompted with the Layer A base properties", () => {
          trackDevicePrompted({ sourceFlow: "send", extraProperties: {} });

          expect(mockedTrack).toHaveBeenCalledWith("device_prompted", {
            ...layerABaseProperties,
            sourceFlow: "send",
          });
        });
      });
    });
  });

  describe("trackDeviceConnecting", () => {
    describe("Given the full connecting info", () => {
      describe("When called", () => {
        it("Then tracks device_connecting with sourceFlow, modelId, transport and matchedDevice", () => {
          trackDeviceConnecting({
            sourceFlow: "earn",
            modelId: DeviceModelId.nanoX,
            transport: "ble",
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("device_connecting", {
            ...layerABaseProperties,
            sourceFlow: "earn",
            modelId: DeviceModelId.nanoX,
            transport: "ble",
            matchedDevice: DeviceModelId.nanoX,
          });
        });
      });
    });
  });

  describe("trackDeviceConnected", () => {
    describe("Given the full connection info", () => {
      describe("When called", () => {
        it("Then tracks device_connected with sourceFlow, modelId, transport and matchedDevice", () => {
          trackDeviceConnected({
            sourceFlow: "wallet_connect",
            modelId: DeviceModelId.stax,
            transport: "ble",
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("device_connected", {
            ...layerABaseProperties,
            sourceFlow: "wallet_connect",
            modelId: DeviceModelId.stax,
            transport: "ble",
            matchedDevice: DeviceModelId.stax,
          });
        });
      });
    });
  });

  describe("trackAppReady", () => {
    describe("Given a sourceFlow and modelId", () => {
      describe("When called", () => {
        it("Then tracks app_ready with sourceFlow and modelId", () => {
          trackAppReady({
            sourceFlow: "add_account",
            modelId: DeviceModelId.nanoSP,
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("app_ready", {
            ...layerABaseProperties,
            sourceFlow: "add_account",
            modelId: DeviceModelId.nanoSP,
          });
        });
      });
    });
  });

  describe("trackDeviceflowCompleted", () => {
    describe("Given full completion info", () => {
      describe("When called", () => {
        it("Then tracks deviceflow_completed with sourceFlow, modelId and transport", () => {
          trackDeviceflowCompleted({
            sourceFlow: "onboarding",
            modelId: DeviceModelId.europa,
            transport: "usb",
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("deviceflow_completed", {
            ...layerABaseProperties,
            sourceFlow: "onboarding",
            modelId: DeviceModelId.europa,
            transport: "usb",
          });
        });
      });
    });
  });

  describe("trackDeviceflowCanceled", () => {
    const ensureAppReadyDevice: ConnectedDevice = { ...connectedDevice, type: "USB" };

    it("GIVEN no failure is displayed WHEN called THEN it tracks deviceflow_aborted with the base properties only", () => {
      trackDeviceflowCanceled({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
    });

    it("GIVEN a blocking connect app failure WHEN called THEN it tracks deviceflow_failed with the failure", () => {
      recordEnsureAppReadyFailure(
        { type: BlockingStateType.UnsupportedFirmwareVersion },
        ensureAppReadyDevice,
      );

      trackDeviceflowCanceled({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        failureType: "UnsupportedFirmwareVersion",
        modelId: DeviceModelId.stax,
        transport: "usb",
      });
    });

    it("GIVEN a generic connect app error WHEN called THEN it tracks deviceflow_failed with the error tag as subError", () => {
      recordEnsureAppReadyFailure(
        { type: FinalStateType.Error, error: { _tag: "SendApduTimeoutError" } },
        ensureAppReadyDevice,
      );

      trackDeviceflowCanceled({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith(
        "deviceflow_failed",
        expect.objectContaining({
          failureType: "ConnectAppError",
          subError: "SendApduTimeoutError",
        }),
      );
    });

    it("GIVEN a retryable connect app failure WHEN called THEN it tracks deviceflow_aborted with the failure", () => {
      recordEnsureAppReadyFailure(
        { type: RetryableStateType.DeviceBusy, retry: jest.fn() },
        ensureAppReadyDevice,
      );

      trackDeviceflowCanceled({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith(
        "deviceflow_aborted",
        expect.objectContaining({ failureType: "DeviceBusy" }),
      );
    });

    it("GIVEN a discovery error without retry WHEN called THEN it tracks deviceflow_failed with the discovery failure", () => {
      recordConnectDeviceFailure({
        type: ConnectDeviceUIStateTypes.DiscoveryError,
        error: {
          type: BaseDiscoveryErrorTypes.Unknown,
          error: { _tag: "NoAccessibleDeviceError" },
        },
        ignore: jest.fn(),
      });

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "send",
        failureType: "DiscoveryError",
        subError: "NoAccessibleDeviceError",
      });
    });

    it("GIVEN a device disconnected by the executor WHEN called THEN it tracks deviceflow_failed with the device", () => {
      recordExecutorStateFailure({ type: "deviceDisconnected", device: connectedDevice });

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "send",
        failureType: "DeviceDisconnected",
        modelId: DeviceModelId.stax,
        transport: "ble",
      });
    });

    it("GIVEN an invalid executor operation WHEN called THEN it tracks deviceflow_failed with the error name", () => {
      recordExecutorStateFailure({ type: "invalidOperation", error: new TypeError("boom") });

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith(
        "deviceflow_failed",
        expect.objectContaining({ failureType: "InvalidOperation", subError: "TypeError" }),
      );
    });

    it("GIVEN the page changed after the failure was displayed WHEN called THEN it still reports the failure", () => {
      recordEnsureAppReadyFailure(
        { type: BlockingStateType.InvalidProvider },
        ensureAppReadyDevice,
      );
      setTrackingSource(PAGE_CONNECT_APP.Loading);

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith(
        "deviceflow_failed",
        expect.objectContaining({ failureType: "InvalidProvider" }),
      );
    });

    it("GIVEN the flow left the error state WHEN called THEN it tracks deviceflow_aborted without failure", () => {
      recordEnsureAppReadyFailure(
        { type: BlockingStateType.InvalidProvider },
        ensureAppReadyDevice,
      );
      recordEnsureAppReadyFailure({ type: LoadingStateType.Loading }, ensureAppReadyDevice);

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "send",
      });
    });

    it("GIVEN a failure already reported WHEN called again THEN it does not report it twice", () => {
      recordExecutorStateFailure({ type: "deviceDisconnected", device: connectedDevice });
      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });
      mockedTrack.mockClear();

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "send",
      });
    });

    it("GIVEN a failure left by a previous flow WHEN a new flow starts THEN it is not reported", () => {
      recordExecutorStateFailure({ type: "deviceDisconnected", device: connectedDevice });
      trackDeviceflowStarted({ sourceFlow: "send", extraProperties: {} });
      mockedTrack.mockClear();

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "send",
      });
    });
  });

  describe("getTrackingTransport", () => {
    describe("Given a transport id", () => {
      describe("When called", () => {
        it("Then maps HID to usb, other transports to ble, and keeps unknown transport undefined", () => {
          expect(getTrackingTransport(rnHidTransportIdentifier)).toBe("usb");
          expect(getTrackingTransport(TEST_BLE_TRANSPORT)).toBe("ble");
          expect(getTrackingTransport(undefined)).toBeUndefined();
        });
      });
    });
  });

  describe("getConnectedDeviceTrackingProperties", () => {
    it("GIVEN a connected device WHEN called THEN it maps DMK model and transport to tracking values", () => {
      const usbDevice: ConnectedDevice = {
        ...connectedDevice,
        modelId: DMKDeviceModelId.NANO_X,
        type: "USB",
      };

      expect(getConnectedDeviceTrackingProperties(connectedDevice)).toEqual({
        modelId: DeviceModelId.stax,
        transport: "ble",
      });
      expect(getConnectedDeviceTrackingProperties(usbDevice)).toEqual({
        modelId: DeviceModelId.nanoX,
        transport: "usb",
      });
    });
  });

  describe("PAGE_DEVICE_ACTION", () => {
    it("GIVEN generic DIE error pages THEN it exposes the expected page event names", () => {
      expect(PAGE_DEVICE_ACTION).toEqual({
        Disconnected: "Device Action - Disconnected",
        UnknownIntentError: "Device Action - Unknown Intent Error",
        InvalidState: "Device Action - Invalid State",
      });
    });
  });

  describe("trackDeviceSelected", () => {
    describe("Given a sourceFlow and a known device", () => {
      describe("When called", () => {
        it("Then tracks device_selected with the modelId and transport derived from the device", () => {
          trackDeviceSelected({
            sourceFlow: "receive",
            device: {
              id: "device-id",
              name: "Ledger Nano S",
              deviceModelId: DeviceModelId.nanoS,
              transport: TEST_BLE_TRANSPORT,
            },
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("device_selected", {
            ...layerABaseProperties,
            sourceFlow: "receive",
            modelId: DeviceModelId.nanoS,
            transport: "ble",
          });
        });
      });
    });
  });

  describe("trackConnectDeviceButtonClicked", () => {
    describe("Given a sourceFlow and button", () => {
      describe("When called", () => {
        it("Then tracks button_clicked without overriding the current page", () => {
          trackConnectDeviceButtonClicked({
            sourceFlow: "send",
            button: "Retry",
            extraProperties: {},
          });

          expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
            ...layerABaseProperties,
            sourceFlow: "send",
            button: "Retry",
          });
        });
      });
    });
  });

  describe("trackConnectAppButtonClicked", () => {
    it("GIVEN sourceFlow modelId and button WHEN called THEN it tracks button_clicked without overriding the current page", () => {
      trackConnectAppButtonClicked({
        sourceFlow: "send",
        modelId: DeviceModelId.stax,
        button: "Retry",
        extraProperties: {},
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "send",
        modelId: DeviceModelId.stax,
        button: "Retry",
      });
    });
  });

  describe("trackDeviceActionButtonClicked", () => {
    it("GIVEN sourceFlow button and device properties WHEN called THEN it tracks button_clicked without overriding the current page", () => {
      trackDeviceActionButtonClicked({
        sourceFlow: "send",
        button: DEVICE_ACTION_BUTTON.Close,
        modelId: DeviceModelId.stax,
        transport: "ble",
        extraProperties: {},
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "send",
        button: DEVICE_ACTION_BUTTON.Close,
        modelId: DeviceModelId.stax,
        transport: "ble",
      });
    });
  });

  describe("contextual analytics properties propagation", () => {
    const extraProperties = { manifestId: "swap-live-app", manifestName: "Swap" };

    const trackingHelpers = [
      {
        name: "trackDeviceflowStarted",
        track: () => trackDeviceflowStarted({ sourceFlow: "wallet_api", extraProperties }),
      },
      {
        name: "trackDevicePrompted",
        track: () => trackDevicePrompted({ sourceFlow: "wallet_api", extraProperties }),
      },
      {
        name: "trackDeviceConnecting",
        track: () =>
          trackDeviceConnecting({
            sourceFlow: "wallet_api",
            modelId: DeviceModelId.stax,
            transport: "ble",
            extraProperties,
          }),
      },
      {
        name: "trackDeviceConnected",
        track: () =>
          trackDeviceConnected({
            sourceFlow: "wallet_api",
            modelId: DeviceModelId.stax,
            transport: "ble",
            extraProperties,
          }),
      },
      {
        name: "trackAppReady",
        track: () =>
          trackAppReady({ sourceFlow: "wallet_api", modelId: DeviceModelId.stax, extraProperties }),
      },
      {
        name: "trackDeviceflowCompleted",
        track: () =>
          trackDeviceflowCompleted({
            sourceFlow: "wallet_api",
            modelId: DeviceModelId.stax,
            transport: "ble",
            extraProperties,
          }),
      },
      {
        name: "trackDeviceflowCanceled",
        track: () => trackDeviceflowCanceled({ sourceFlow: "wallet_api", extraProperties }),
      },
      {
        name: "trackDeviceSelected",
        track: () =>
          trackDeviceSelected({
            sourceFlow: "wallet_api",
            device: {
              id: "device-id",
              name: "Ledger Nano S",
              deviceModelId: DeviceModelId.nanoS,
              transport: TEST_BLE_TRANSPORT,
            },
            extraProperties,
          }),
      },
      {
        name: "trackConnectDeviceButtonClicked",
        track: () =>
          trackConnectDeviceButtonClicked({
            sourceFlow: "wallet_api",
            button: "Retry",
            extraProperties,
          }),
      },
      {
        name: "trackConnectAppButtonClicked",
        track: () =>
          trackConnectAppButtonClicked({
            sourceFlow: "wallet_api",
            modelId: DeviceModelId.stax,
            button: "Retry",
            extraProperties,
          }),
      },
      {
        name: "trackDeviceActionButtonClicked",
        track: () =>
          trackDeviceActionButtonClicked({
            sourceFlow: "wallet_api",
            button: DEVICE_ACTION_BUTTON.Retry,
            modelId: DeviceModelId.stax,
            transport: "ble",
            extraProperties,
          }),
      },
      {
        name: "trackDrawerCloseButtonClicked",
        track: () => trackDrawerCloseButtonClicked({ sourceFlow: "wallet_api", extraProperties }),
      },
    ];

    describe.each(trackingHelpers)("$name", ({ track: trackEvent }) => {
      it("GIVEN contextual analytics properties WHEN tracking THEN it forwards them to the event", () => {
        // GIVEN
        const expectedProperties = expect.objectContaining(extraProperties);

        // WHEN
        trackEvent();

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith(expect.any(String), expectedProperties);
      });
    });
  });
});
