import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { urls } from "~/utils/urls";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { ConnectionErrorState } from "./ConnectionErrorState";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
    track: jest.fn(),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);
const TEST_SOURCE = "Connect Device - Connection Error";

type ConnectionErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.ConnectionError }
>;

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

const errorCases = [
  {
    type: ConnectionErrorTypes.BlePairingRefused,
    title: "Pairing was refused",
    description: undefined,
    cta: "Retry pairing",
  },
  {
    type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
    title: "Go to your phone’s Bluetooth settings to unpair Ledger device",
    description:
      "To fix the pairing issue, remove Ledger device from your phone’s Bluetooth list, then return to this app and try again.",
    cta: "Learn how to fix",
  },
  {
    type: ConnectionErrorTypes.Unknown,
    title: "Pairing unsuccessful",
    description: "Please try again or read our Bluetooth troubleshooting article below.",
    cta: "Try again",
  },
] as const;

function renderState(errorType: ConnectionErrorTypes) {
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
    <SourceFlowProvider value="my_ledger">
      <ConnectionErrorState state={state} />
    </SourceFlowProvider>,
  );

  return { ...view, retry, ignore };
}

describe("ConnectionErrorState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it.each(errorCases)(
    "should render the $type error content",
    ({ type, title, description, cta }) => {
      renderState(type);

      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByText(cta)).toBeVisible();

      if (description) {
        expect(screen.getByText(description)).toBeVisible();
      }
    },
  );

  it("should render the unknown error tip", () => {
    renderState(ConnectionErrorTypes.Unknown);

    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("should call retry when the retry button is pressed", async () => {
    const { user, retry } = renderState(ConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Try again"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      button: "Retry",
    });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should open the generic pairing help article", async () => {
    const { user } = renderState(ConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Get help"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      button: "Get Help",
    });
    expect(Linking.openURL).toHaveBeenCalledWith(urls.pairingIssues);
  });

  it("GIVEN a connection error WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN / WHEN
    renderState(ConnectionErrorTypes.Unknown);

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
});
