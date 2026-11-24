import React from "react";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectNewDeviceUIStateTypes,
  BaseDiscoveryErrorTypes,
  rnBleTransportIdentifier,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { ConnectNewDeviceView } from "./ConnectNewDeviceView";
import type { ConnectNewDeviceNonErrorUIState } from "./types";

const mockedTrack = jest.mocked(track);
const mockedTrackScreen = jest.mocked(TrackScreen);

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const discoveringState: ConnectNewDeviceNonErrorUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [{ key: "nano-x", device, isAvailable: true, onSelect: jest.fn() }],
  scanningTransports: [rnBleTransportIdentifier],
  showDeviceNotFound: false,
};

const element = (viewState: ConnectNewDeviceUIState) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "onboarding" }}>
    <ConnectNewDeviceView
      state={viewState}
      lastNonErrorState={discoveringState}
      platform="android"
      onCloseErrorSheet={jest.fn()}
      isNewDevice={() => true}
    />
  </DeviceIntentTrackingProvider>
);

function renderView(state: ConnectNewDeviceUIState) {
  const view = render(element(state));

  return {
    ...view,
    rerenderState: (viewState: ConnectNewDeviceUIState) => view.rerender(element(viewState)),
  };
}

const unknownDiscoveryError: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.DiscoveryError,
  error: { type: BaseDiscoveryErrorTypes.Unknown },
  retry: jest.fn(),
  ignore: jest.fn(),
  close: jest.fn(),
};

const discoveringPageCalls = () =>
  mockedTrackScreen.mock.calls.filter(
    ([props]) => props.category === "Connect Device - Discovering",
  );

const trackedEvents = (eventName: string) =>
  mockedTrack.mock.calls.filter(([name]) => name === eventName).map(([, properties]) => properties);

describe("ConnectNewDeviceView tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN discovery runs, WHEN the list shows, THEN it should send the Discovering page with the scanning mode", () => {
    // GIVEN / WHEN
    renderView(discoveringState);

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Connect Device - Discovering",
        scanningMode: "bluetooth",
      }),
      undefined,
    );
  });

  it("GIVEN a device the app does not know, WHEN the user taps it, THEN it should send device_selected with isNewDevice true", async () => {
    // GIVEN
    const { user } = renderView(discoveringState);

    // WHEN
    await user.press(screen.getByRole("button", { name: /Ledger Nano X/ }));

    // THEN
    expect(trackedEvents("device_selected")).toEqual([
      {
        sourceFlow: "onboarding",
        deviceUxV2: true,
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        isNewDevice: true,
      },
    ]);
  });

  it("GIVEN an error sheet over the list, WHEN the error is fixed, THEN it should send the Discovering page again", () => {
    // GIVEN
    const { rerenderState } = renderView(unknownDiscoveryError);
    expect(discoveringPageCalls()).toEqual([]);

    // WHEN
    rerenderState(discoveringState);

    // THEN
    expect(discoveringPageCalls()).not.toEqual([]);
  });

  it("GIVEN a discovery error, WHEN the user presses Close, THEN it should send Close with the error", async () => {
    // GIVEN
    const { user } = renderView(unknownDiscoveryError);

    // WHEN
    await user.press(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(trackedEvents("button_clicked")).toEqual([
      { sourceFlow: "onboarding", deviceUxV2: true, button: "Close", subError: "Unknown" },
    ]);
  });
});
