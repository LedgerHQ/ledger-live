import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  rnBleTransportIdentifier,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { TrackScreen, track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE, trackDeviceflowCanceled } from "../../utils/trackDeviceIntent";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

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

type DiscoveryErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.DiscoveryError }
>;

const errorCases = [
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
    title: "Allow Bluetooth access",
    description: "Allow Bluetooth to scan for nearby Ledger devices.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
    title: "Allow Bluetooth access",
    description:
      "Bluetooth permission is required. Go to Settings → Apps → Ledger Wallet → Permissions → Nearby devices, then come back.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
    title: "Allow Bluetooth access",
    description:
      "Ledger Wallet needs Bluetooth permission to find your device. Enable it in Settings.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
    title: "Turn on Bluetooth",
    description: "Bluetooth is off. Turn it on to find your Ledger device.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    title: "Turn on Bluetooth",
    description: "Bluetooth is off. Turn it on in your Settings → Bluetooth, then come back.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly,
    title: "Checking Bluetooth...",
    description: undefined,
  },
  {
    type: DiscoveryErrorTypes.BluetoothUnsupported,
    title: "Bluetooth not supported",
    description:
      "This phone doesn’t support Bluetooth. You can connect your Ledger device via USB instead.",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable,
    title: "Allow location access",
    description: "Android needs Location permission to scan for Bluetooth devices.",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    title: "Allow location access",
    description:
      "Location permission is required to scan for Bluetooth devices. Go to Settings → Apps → Ledger Wallet → Permissions → Location, then come back.",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledPromptable,
    title: "Turn on Location",
    description: "Location services are off. Turn them on to scan for Bluetooth devices.",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledManualAction,
    title: "Turn on Location",
    description:
      "Location services are off. Turn them on from Settings → Location, then come back.",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    title: "Allow location access",
    description: "Location permission seems missing. Tap below to try again.",
  },
  {
    type: DiscoveryErrorTypes.Unknown,
    title: "Something went wrong",
    description:
      "We couldn’t start the Bluetooth scan. Please try again or contact Ledger support.",
  },
] as const;

const primaryCtaButtonCases = [
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
    label: "Allow",
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
    label: "Turn on Bluetooth",
    button: "Turn On Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    label: "I enabled Bluetooth, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable,
    label: "Allow",
    button: "Allow Location",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    label: "I enabled it, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledPromptable,
    label: "Turn on Location",
    button: "Turn On Location",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledManualAction,
    label: "I enabled Location, try again",
    button: "Open Settings",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    label: "Try again",
    button: "Retry",
  },
  {
    type: DiscoveryErrorTypes.Unknown,
    label: "Try again",
    button: "Retry",
  },
] as const;

function makeDiscoveryError(type: DiscoveryErrorTypes): DiscoveryError {
  const resolvable: {
    transportId: typeof rnBleTransportIdentifier;
    resolution: { type: "none" };
  } = {
    transportId: rnBleTransportIdentifier,
    resolution: { type: "none" },
  };

  switch (type) {
    case DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable:
    case DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings:
      return { ...resolvable, type, permissions: [] };
    case DiscoveryErrorTypes.LocationPermissionDeniedPromptable:
    case DiscoveryErrorTypes.LocationPermissionDeniedManualSettings:
      return { ...resolvable, type, permission: "location" };
    case DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings:
    case DiscoveryErrorTypes.BluetoothDisabledPromptable:
    case DiscoveryErrorTypes.BluetoothDisabledManualAction:
    case DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly:
    case DiscoveryErrorTypes.BluetoothUnsupported:
    case DiscoveryErrorTypes.LocationDisabledPromptable:
    case DiscoveryErrorTypes.LocationDisabledManualAction:
    case DiscoveryErrorTypes.LocationServicePermissionMissing:
      return { ...resolvable, type };
    case DiscoveryErrorTypes.Unknown:
      return { type };
  }
}

function renderState({
  type,
  retry,
  platform = "android",
  error,
}: {
  type: DiscoveryErrorTypes;
  retry?: DiscoveryErrorUIState["retry"];
  platform?: Exclude<AppPlatform, "desktop">;
  error?: DiscoveryError;
}) {
  const ignore = jest.fn();
  const state: DiscoveryErrorUIState = {
    type: ConnectDeviceUIStateTypes.DiscoveryError,
    error: error ?? makeDiscoveryError(type),
    retry,
    ignore,
  };

  const view = render(
    <SourceFlowProvider value="my_ledger">
      <DiscoveryErrorState state={state} platform={platform} />
    </SourceFlowProvider>,
  );

  return { ...view, ignore };
}

describe("DiscoveryErrorState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRouteNameRef.current = PAGE_CONNECT_DEVICE.DiscoveryError;
  });

  it.each(errorCases)("should render the $type error title", ({ type, title }) => {
    renderState({ type });

    expect(screen.getByText(title)).toBeVisible();
  });

  it.each(errorCases.filter(({ description }) => description))(
    "GIVEN a $type error with a description WHEN rendering THEN it renders the error description",
    ({ type, description }) => {
      // GIVEN
      if (!description) {
        throw new Error("Expected error case to include a description");
      }

      // WHEN
      renderState({ type });

      // THEN
      expect(screen.getByText(description)).toBeVisible();
    },
  );

  it("should render the translated retry cta when a retry callback is available", async () => {
    const retry = jest.fn();
    const { user } = renderState({
      type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
      retry,
    });

    await user.press(screen.getByText("Allow"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry when no retry callback is available", () => {
    renderState({ type: DiscoveryErrorTypes.BluetoothUnsupported });

    expect(screen.queryByText("Allow")).toBeNull();
  });

  it("should render the translated continue with USB cta on Android when available", async () => {
    const { user, ignore } = renderState({
      type: DiscoveryErrorTypes.LocationDisabledManualAction,
    });

    await user.press(screen.getByText("Continue with USB"));

    expect(ignore).toHaveBeenCalledTimes(1);
  });

  it("should hide Android USB fallback on iOS-only discovery errors", () => {
    renderState({
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
      platform: "ios",
    });

    expect(screen.queryByText("Continue with USB")).toBeNull();
  });

  it("should render the iOS Bluetooth unsupported copy without a CTA", () => {
    renderState({
      type: DiscoveryErrorTypes.BluetoothUnsupported,
      platform: "ios",
    });

    expect(
      screen.getByText(
        "This phone doesn’t support Bluetooth. Please use Ledger Wallet desktop or contact Ledger support.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Continue with USB")).toBeNull();
  });

  it("GIVEN a discovery error WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN / WHEN
    renderState({ type: DiscoveryErrorTypes.BluetoothDisabledPromptable });

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.DiscoveryError,
        sourceFlow: "my_ledger",
        transport: "ble",
        subError: "BluetoothDisabledPromptable",
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN an unknown discovery error without transport WHEN rendering THEN it does not invent a transport", () => {
    // GIVEN / WHEN
    renderState({ type: DiscoveryErrorTypes.Unknown });

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

  it("GIVEN an unknown discovery error without resolution WHEN cancelling THEN it tracks deviceflow_failed", () => {
    // GIVEN
    renderState({ type: DiscoveryErrorTypes.Unknown });
    mockedTrack.mockClear();

    // WHEN
    trackDeviceflowCanceled({ sourceFlow: "my_ledger" });

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
    });
  });

  it("GIVEN a discovery error with no recovery resolution WHEN cancelling THEN it tracks deviceflow_failed", () => {
    // GIVEN
    renderState({ type: DiscoveryErrorTypes.BluetoothUnsupported });
    mockedTrack.mockClear();

    // WHEN
    trackDeviceflowCanceled({ sourceFlow: "my_ledger" });

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
    });
  });

  it("GIVEN a discovery error with a retryable resolution WHEN cancelling THEN it tracks deviceflow_aborted", () => {
    // GIVEN
    renderState({
      type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
      error: {
        type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
        transportId: rnBleTransportIdentifier,
        resolution: { type: "prompt", retry: jest.fn() },
      },
    });
    mockedTrack.mockClear();

    // WHEN
    trackDeviceflowCanceled({ sourceFlow: "my_ledger" });

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
    });
  });

  it("GIVEN a terminal discovery error unmounted WHEN cancelling THEN it tracks deviceflow_aborted", () => {
    // GIVEN
    const { unmount } = renderState({ type: DiscoveryErrorTypes.Unknown });
    unmount();
    mockedTrack.mockClear();

    // WHEN
    trackDeviceflowCanceled({ sourceFlow: "my_ledger" });

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
    });
  });

  it.each(primaryCtaButtonCases)(
    "GIVEN a $type primary CTA WHEN it is pressed THEN it tracks the canonical button value",
    async ({ type, label, button }) => {
      // GIVEN
      const retry = jest.fn();
      const { user } = renderState({
        type,
        retry,
      });

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
      type: DiscoveryErrorTypes.LocationDisabledManualAction,
    });

    // WHEN
    await user.press(screen.getByText("Continue with USB"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      button: "Continue with USB",
    });
    expect(ignore).toHaveBeenCalledTimes(1);
  });
});
