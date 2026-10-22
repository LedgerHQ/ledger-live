import { track, resetTrackingPages, setTrackingSource } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import { makeDiscoveryError } from "LLM/components/DeviceConnection/__fixtures__/discoveryError";
import { DeviceIntentTrackingProvider } from "../../utils/DeviceIntentTrackingContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);

type DiscoveryErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: typeof ConnectDeviceUIStateTypes.DiscoveryError }
>;

const primaryCtaButtonCases = [
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
    label: "Allow Bluetooth",
    button: "Allow Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
    label: "I enabled it, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
    label: "I enabled it, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
    label: "Enable Bluetooth",
    button: "Turn On Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    label: "I enabled Bluetooth, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable,
    label: "Enable",
    button: "Allow Location",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    label: "I enabled it, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledPromptable,
    label: "Enable Location",
    button: "Turn On Location",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledManualAction,
    label: "I enabled it, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    label: "Try again",
    button: "Retry",
  },
  {
    type: BaseDiscoveryErrorTypes.Unknown,
    label: "Try again",
    button: "Retry",
  },
] as const;

function renderState({
  error,
  retry,
}: {
  error: DiscoveryError;
  retry?: DiscoveryErrorUIState["retry"];
}) {
  const ignore = jest.fn();
  const state: DiscoveryErrorUIState = {
    type: ConnectDeviceUIStateTypes.DiscoveryError,
    error,
    retry,
    ignore,
  };

  const view = render(
    <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
      <DiscoveryErrorState state={state} platform="android" />
    </DeviceIntentTrackingProvider>,
  );

  return { ...view, ignore };
}

describe("DiscoveryErrorState (DIE tracking)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setTrackingSource(PAGE_CONNECT_DEVICE.DiscoveryError);
  });

  afterEach(resetTrackingPages);

  it("GIVEN a discovery error WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN / WHEN
    renderState({ error: makeDiscoveryError(DiscoveryErrorTypes.BluetoothDisabledPromptable) });

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.DiscoveryError,
        sourceFlow: "my_ledger",
        transport: "ble",
        subError: "bluetooth-disabled-promptable",
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN an unknown discovery error without transport WHEN rendering THEN it does not invent a transport", () => {
    // GIVEN / WHEN
    renderState({ error: makeDiscoveryError(BaseDiscoveryErrorTypes.Unknown) });

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.DiscoveryError,
        sourceFlow: "my_ledger",
        subError: "Unknown",
        deviceUxV2: true,
      }),
      undefined,
    );
    expect(mockedTrackScreen.mock.calls[0]?.[0]).not.toHaveProperty("transport");
  });

  it("GIVEN an unknown discovery error wrapping a DMK error WHEN rendering THEN it tracks the wrapped error as subError", () => {
    // GIVEN / WHEN
    renderState({
      error: {
        type: BaseDiscoveryErrorTypes.Unknown,
        error: { _tag: "TransportNotSupportedError" },
      },
    });

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({ subError: "TransportNotSupportedError" }),
      undefined,
    );
  });

  it.each(primaryCtaButtonCases)(
    "GIVEN a $type primary CTA WHEN it is pressed THEN it tracks the canonical button value",
    async ({ type, label, button }) => {
      // GIVEN
      const retry = jest.fn();
      const { user } = renderState({ error: makeDiscoveryError(type), retry });

      // WHEN
      const cta = screen.getAllByText(label).at(-1);
      if (!cta) throw new Error(`Missing CTA: ${label}`);
      await user.press(cta);

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        sourceFlow: "my_ledger",
        deviceUxV2: true,
        button,
      });
      expect(retry).toHaveBeenCalledTimes(1);
    },
  );

  it("GIVEN an ignore CTA WHEN it is pressed THEN it tracks button_clicked", async () => {
    // GIVEN
    const { user, ignore } = renderState({
      error: makeDiscoveryError(DiscoveryErrorTypes.LocationDisabledManualAction),
    });

    // WHEN
    await user.press(screen.getByText("Continue with USB instead"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      button: "Continue with USB",
    });
    expect(ignore).toHaveBeenCalledTimes(1);
  });
});
