import { webHidTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import { ledgerToDmkDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import {
  CONNECT_DEVICE_BUTTON,
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  getTrackingSubError,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  PAGE_DEVICE_ACTION,
  setIsInTerminalConnectDeviceError,
  trackAppReady,
  trackConnectDeviceButtonClicked,
  trackDeviceActionButtonClicked,
  trackDeviceConnected,
  trackDeviceConnecting,
  trackDeviceflowAborted,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowFailed,
  trackDeviceflowStarted,
  trackDevicePrompted,
  trackDeviceSelected,
  trackDrawerCloseButtonClicked,
} from "./trackDeviceIntent";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockedTrack = jest.mocked(track);

const connectedDevice = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: ledgerToDmkDeviceIdMap[DeviceModelId.stax],
  sessionId: "session-id",
  type: "BLE" as const,
  transport: "ble" as const,
};

const layerABaseProperties = {
  deviceUxV2: true,
};

describe("trackDeviceIntent — Layer A tracking helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRouteNameRef.current = "Connect Device - Connecting";
    setIsInTerminalConnectDeviceError(false);
  });

  describe("trackDeviceflowStarted", () => {
    it("GIVEN a sourceFlow WHEN called THEN tracks deviceflow_started with the Layer A base properties", () => {
      trackDeviceflowStarted({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledTimes(1);
      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_started", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
    });
  });

  describe("trackAppReady", () => {
    it("GIVEN a sourceFlow and modelId WHEN called THEN tracks app_ready with sourceFlow and modelId", () => {
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

  describe("trackDeviceflowCompleted", () => {
    it("GIVEN full completion info WHEN called THEN tracks deviceflow_completed with sourceFlow, modelId and transport", () => {
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

  describe("trackDeviceflowAborted", () => {
    it("GIVEN a sourceFlow WHEN called THEN tracks deviceflow_aborted with the Layer A base properties", () => {
      trackDeviceflowAborted({ sourceFlow: "my_ledger", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "my_ledger",
      });
    });
  });

  describe("trackDeviceflowFailed", () => {
    it("GIVEN a sourceFlow WHEN called THEN tracks deviceflow_failed with the Layer A base properties", () => {
      trackDeviceflowFailed({ sourceFlow: "my_ledger", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "my_ledger",
      });
    });
  });

  describe("trackDeviceflowCanceled", () => {
    it("GIVEN the current page is non-blocking WHEN called THEN it tracks deviceflow_aborted", () => {
      currentRouteNameRef.current = "Connect Device - Connecting";

      trackDeviceflowCanceled({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
    });

    it.each([
      PAGE_DEVICE_ACTION.Disconnected,
      PAGE_DEVICE_ACTION.UnknownIntentError,
      PAGE_DEVICE_ACTION.InvalidState,
    ])(
      "GIVEN the current page is shell error page %s WHEN called THEN it tracks deviceflow_failed",
      page => {
        currentRouteNameRef.current = page;

        trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

        expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
          ...layerABaseProperties,
          sourceFlow: "send",
        });
      },
    );

    it("GIVEN a terminal Connect Device error WHEN called THEN it tracks deviceflow_failed", () => {
      currentRouteNameRef.current = PAGE_CONNECT_DEVICE.ConnectionError;
      setIsInTerminalConnectDeviceError(true);

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "send",
      });
    });

    it("GIVEN a retryable Connect Device discovery error WHEN called THEN it tracks deviceflow_aborted", () => {
      currentRouteNameRef.current = PAGE_CONNECT_DEVICE.DiscoveryError;

      trackDeviceflowCanceled({ sourceFlow: "send", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "send",
      });
    });
  });

  describe("Connect Device tracking helpers", () => {
    it("GIVEN a Connect Device page WHEN inspecting constants THEN it exposes stable page names", () => {
      expect(PAGE_CONNECT_DEVICE).toEqual({
        NoKnownDevice: "Connect Device - No Known Device",
        Discovering: "Connect Device - Discovering",
        WaitingForSelectedDevice: "Connect Device - Waiting For Device",
        Connecting: "Connect Device - Connecting",
        DiscoveryError: "Connect Device - Discovery Error",
        ConnectionError: "Connect Device - Connection Error",
      });
    });

    it("GIVEN a selected USB device WHEN tracking THEN it sends the selected model and USB transport", () => {
      const device: KnownDevice = {
        id: "device-id",
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
        transport: webHidTransportIdentifier,
      };

      trackDeviceSelected({ sourceFlow: "swap", device, extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("device_selected", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
        transport: "usb",
      });
    });

    it("GIVEN Connect Device funnel data WHEN tracking THEN it sends the expected events and properties", () => {
      trackDevicePrompted({ sourceFlow: "swap", extraProperties: {} });
      trackDeviceConnecting({
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
        transport: "usb",
        extraProperties: {},
      });
      trackDeviceConnected({
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
        transport: "usb",
        extraProperties: {},
      });
      trackConnectDeviceButtonClicked({
        sourceFlow: "swap",
        button: CONNECT_DEVICE_BUTTON.Retry,
        extraProperties: {},
      });

      expect(mockedTrack).toHaveBeenNthCalledWith(1, "device_prompted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(2, "device_connecting", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
        transport: "usb",
        matchedDevice: DeviceModelId.nanoX,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(3, "device_connected", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
        transport: "usb",
        matchedDevice: DeviceModelId.nanoX,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(4, "button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: CONNECT_DEVICE_BUTTON.Retry,
      });
    });

    it("GIVEN an unknown error and no transport WHEN mapping them THEN it preserves the expected values", () => {
      expect(getTrackingTransport(undefined)).toBeUndefined();
      expect(getTrackingSubError("unknown" as never)).toBe("Unknown");
    });
  });

  describe("getConnectedDeviceTrackingProperties", () => {
    it("GIVEN a connected device WHEN called THEN it maps DMK model and transport to tracking values", () => {
      const usbDevice = {
        ...connectedDevice,
        modelId: ledgerToDmkDeviceIdMap[DeviceModelId.nanoX],
        type: "USB" as const,
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

  describe("trackDrawerCloseButtonClicked", () => {
    it("GIVEN a sourceFlow WHEN called THEN it tracks Close button_clicked", () => {
      trackDrawerCloseButtonClicked({ sourceFlow: "swap", extraProperties: {} });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: DEVICE_ACTION_BUTTON.Close,
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
        name: "trackDeviceflowAborted",
        track: () => trackDeviceflowAborted({ sourceFlow: "wallet_api", extraProperties }),
      },
      {
        name: "trackDeviceflowFailed",
        track: () => trackDeviceflowFailed({ sourceFlow: "wallet_api", extraProperties }),
      },
      {
        name: "trackDeviceflowCanceled",
        track: () => trackDeviceflowCanceled({ sourceFlow: "wallet_api", extraProperties }),
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
        const expectedProperties = expect.objectContaining(extraProperties);

        trackEvent();

        expect(mockedTrack).toHaveBeenCalledWith(expect.any(String), expectedProperties);
      });
    });
  });
});
