import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

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
    description: "Ledger Wallet needs Bluetooth permission to find your device. Enable it in Settings.",
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
    description: "Location services are off. Turn them on from Settings → Location, then come back.",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    title: "Allow location access",
    description: "Location permission seems missing. Tap below to try again.",
  },
  {
    type: DiscoveryErrorTypes.Unknown,
    title: "Something went wrong",
    description: "We couldn’t start the Bluetooth scan. Please try again or contact Ledger support.",
  },
] as const;

function makeDiscoveryError(type: DiscoveryErrorTypes): DiscoveryError {
  if (type === DiscoveryErrorTypes.Unknown) {
    return { type };
  }

  return {
    type,
    transportId: "ble" as TransportIdentifier,
    resolution: { type: "none" },
  } as DiscoveryError;
}

function renderState({
  type,
  retry,
  platform = "android",
}: {
  type: DiscoveryErrorTypes;
  retry?: DiscoveryErrorUIState["retry"];
  platform?: Exclude<AppPlatform, "desktop">;
}) {
  const ignore = jest.fn();
  const state: DiscoveryErrorUIState = {
    type: ConnectDeviceUIStateTypes.DiscoveryError,
    error: makeDiscoveryError(type),
    retry,
    ignore,
  };

  const view = render(<DiscoveryErrorState state={state} platform={platform} />);

  return { ...view, ignore };
}

describe("DiscoveryErrorState", () => {
  it.each(errorCases)(
    "should render the $type error title and description",
    ({ type, title, description }) => {
      renderState({ type });

      expect(screen.getByText(title)).toBeVisible();
      if (description) {
        expect(screen.getByText(description)).toBeVisible();
      }
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
});
