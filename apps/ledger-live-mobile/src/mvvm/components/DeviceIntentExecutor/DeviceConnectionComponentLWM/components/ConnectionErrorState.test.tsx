import { track, resetTrackingPages, setTrackingSource } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  BaseConnectionErrorTypes,
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { urls } from "~/utils/urls";
import { DeviceIntentTrackingProvider } from "../../utils/DeviceIntentTrackingContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { ConnectionErrorState } from "./ConnectionErrorState";

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);

type ConnectionErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: typeof ConnectDeviceUIStateTypes.ConnectionError }
>;
type ConnectionErrorType = ConnectionErrorUIState["error"]["type"];

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function renderState(errorType: ConnectionErrorType) {
  const retry = jest.fn();
  const ignore = jest.fn();
  const state: ConnectionErrorUIState = {
    type: ConnectDeviceUIStateTypes.ConnectionError,
    error: { type: errorType },
    device: makeKnownDevice(),
    retry,
    ignore,
  };

  const view = render(
    <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
      <ConnectionErrorState state={state} />
    </DeviceIntentTrackingProvider>,
  );

  return { ...view, retry, ignore };
}

describe("ConnectionErrorState (DIE tracking)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setTrackingSource(PAGE_CONNECT_DEVICE.ConnectionError);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(resetTrackingPages);

  it("GIVEN a connection error WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN / WHEN
    renderState(BaseConnectionErrorTypes.Unknown);

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.ConnectionError,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        subError: "Unknown",
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN a specific connection error WHEN rendering THEN it tracks its type as subError", () => {
    // GIVEN / WHEN
    renderState(ConnectionErrorTypes.BlePairingRefused);

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({ subError: "ble-pairing-refused" }),
      undefined,
    );
  });

  it.each([
    { type: BaseConnectionErrorTypes.Unknown, label: "Try again" },
    { type: ConnectionErrorTypes.BlePairingPeerRemovedPairing, label: "I unpaired, try again" },
  ])(
    "GIVEN a $type error WHEN retry is pressed THEN it tracks button_clicked and retries",
    async ({ type, label }) => {
      // GIVEN
      const { user, retry } = renderState(type);

      // WHEN
      await user.press(screen.getByText(label));

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        sourceFlow: "my_ledger",
        deviceUxV2: true,
        button: "Retry",
      });
      expect(retry).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { type: BaseConnectionErrorTypes.Unknown, label: "Get help", url: urls.pairingIssues },
    {
      type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
      label: "Learn how to fix",
      url: urls.errors.BleForgetDevice,
    },
  ])(
    "GIVEN a $type error WHEN help is pressed THEN it tracks button_clicked and opens the article",
    async ({ type, label, url }) => {
      // GIVEN
      const { user } = renderState(type);

      // WHEN
      await user.press(screen.getByText(label));

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        sourceFlow: "my_ledger",
        deviceUxV2: true,
        button: "Get Help",
      });
      expect(Linking.openURL).toHaveBeenCalledWith(url);
    },
  );
});
