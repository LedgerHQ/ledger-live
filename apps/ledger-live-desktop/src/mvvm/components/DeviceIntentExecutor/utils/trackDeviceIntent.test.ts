import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
  trackAppReady,
  trackDeviceActionButtonClicked,
  trackDeviceflowAborted,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowFailed,
  trackDeviceflowStarted,
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
