import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  BaseDiscoveryErrorTypes,
  ConnectivityUIStateTypes,
  DiscoveryErrorTypes,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import type { DiscoveryErrorUIState as SharedDiscoveryErrorUIState } from "@ledgerhq/live-dmk-shared";
import { makeDiscoveryError } from "./__fixtures__/discoveryError";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

type DiscoveryErrorUIState = SharedDiscoveryErrorUIState<DiscoveryError>;
type DiscoveryErrorType = DiscoveryError["type"];

const errorCases = [
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
    title: "Connect to your Ledger device via Bluetooth",
    description:
      "Ledger Wallet needs Bluetooth to find and pair with nearby Ledger devices. No data is shared via Bluetooth.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
    title: "Enable Bluetooth in your phone’s Settings",
    description:
      "Ledger Wallet needs Bluetooth permission to find your Ledger device.\n\nGo to Settings → Apps → Ledger Wallet → Permissions → Nearby devices, then come back.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
    title: "Enable Bluetooth in your phone’s Settings",
    description:
      "Ledger Wallet needs Bluetooth permission to find your Ledger device.\n\nGo to Settings → Apps → Ledger Wallet → Bluetooth, then come back.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
    title: "Enable Bluetooth on your phone",
    description: "Enable to scan for nearby Ledger devices.",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    title: "Enable Bluetooth on your phone",
    description:
      "Enable Bluetooth, then come back to retry. Open Settings → Bluetooth. Toggle Bluetooth on, then select the button below.",
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
    title: "Android needs Location enabled to scan for Bluetooth devices",
    description: "Ledger does not access or store your location.",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    title: "Enable Location in Settings",
    description:
      'Android requires this to scan for nearby Bluetooth devices. Go to Settings → Apps → Ledger Wallet → Permissions → Location. Set to "Allow", then select the button below. Ledger does not access or store your location.',
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledPromptable,
    title: "Enable location to scan for Bluetooth devices",
    description:
      "Android requires this to scan for nearby Bluetooth devices. Ledger does not access or store your location.",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledManualAction,
    title: "Location is needed to scan for nearby Bluetooth devices",
    description:
      "Open Settings → Location. Toggle Location on, then come back here and select the button below. Ledger never accesses or stores your location.",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    title: "Location permission couldn't be confirmed",
    description:
      "Android requires this to scan for nearby Bluetooth devices. Select “Try again”, this often resolves it. If not, check Settings → Apps → Ledger Wallet → Permissions → Location. Ledger does not access or store your location.",
  },
  {
    type: BaseDiscoveryErrorTypes.Unknown,
    title: "Bluetooth scanning unsuccessful",
    description:
      "We couldn’t start the Bluetooth scan. Please try again or contact Ledger support.",
  },
] as const;

const primaryCtaCases = [
  { type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable, label: "Allow Bluetooth" },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
    label: "I enabled it, try again",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
    label: "I enabled it, try again",
  },
  { type: DiscoveryErrorTypes.BluetoothDisabledPromptable, label: "Enable Bluetooth" },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    label: "I enabled Bluetooth, try again",
  },
  { type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable, label: "Enable" },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    label: "I enabled it, try again",
  },
  { type: DiscoveryErrorTypes.LocationDisabledPromptable, label: "Enable Location" },
  { type: DiscoveryErrorTypes.LocationDisabledManualAction, label: "I enabled it, try again" },
  { type: DiscoveryErrorTypes.LocationServicePermissionMissing, label: "Try again" },
  { type: BaseDiscoveryErrorTypes.Unknown, label: "Try again" },
] as const;

function renderState({
  type,
  retry,
  platform = "android",
}: {
  type: DiscoveryErrorType;
  retry?: DiscoveryErrorUIState["retry"];
  platform?: Exclude<AppPlatform, "desktop">;
}) {
  const ignore = jest.fn();
  const state: DiscoveryErrorUIState = {
    type: ConnectivityUIStateTypes.DiscoveryError,
    error: makeDiscoveryError(type),
    retry,
    ignore,
  };

  const view = render(<DiscoveryErrorState state={state} platform={platform} />);

  return { ...view, ignore };
}

describe("DiscoveryErrorState", () => {
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

  it("GIVEN an unauthorized Bluetooth error on iOS WHEN rendering THEN it renders the iOS settings copy", () => {
    // GIVEN / WHEN
    renderState({
      type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
      platform: "ios",
    });

    // THEN
    expect(
      screen.getByText(
        "Ledger Wallet needs Bluetooth permission to find your device. Open Settings → Ledger Wallet. Turn on Bluetooth, then tap the button below.",
      ),
    ).toBeVisible();
  });

  it("should render the translated retry cta when a retry callback is available", async () => {
    const retry = jest.fn();
    const { user } = renderState({
      type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
      retry,
    });

    await user.press(screen.getByText("Allow Bluetooth"));

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

    await user.press(screen.getByText("Continue with USB instead"));

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

  it.each(primaryCtaCases)(
    "GIVEN a $type error WHEN its primary CTA is pressed THEN it calls retry",
    async ({ type, label }) => {
      // GIVEN
      const retry = jest.fn();
      const { user } = renderState({ type, retry });

      // WHEN
      const cta = screen.getAllByText(label).at(-1);
      if (!cta) throw new Error(`Missing CTA: ${label}`);
      await user.press(cta);

      // THEN
      expect(retry).toHaveBeenCalledTimes(1);
    },
  );
});
