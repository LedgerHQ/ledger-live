import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

type DiscoveryErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.DiscoveryError }
>;

const errorCases = [
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
    title: "Bluetooth permission needed",
    description: "Please enable Bluetooth permission to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
    title: "Bluetooth permission needed",
    description: "Please enable Bluetooth permission in your phone settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
    title: "Bluetooth permission needed",
    description: "Please enable Bluetooth permission in your phone settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
    title: "Bluetooth settings disabled",
    description: "Please enable Bluetooth settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
    title: "Bluetooth settings disabled",
    description: "Please enable Bluetooth settings in your phone settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly,
    title: "Bluetooth is not ready",
    description: "Please check your Bluetooth settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.BluetoothUnsupported,
    title: "Bluetooth is not supported",
    description: "Bluetooth is not supported. Please check your Bluetooth settings.",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable,
    title: "Location permission needed",
    description: "Please enable Location permission to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
    title: "Location permission needed",
    description: "Please enable Location permission in your phone settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledPromptable,
    title: "Location settings disabled",
    description: "Please enable Location settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.LocationDisabledManualAction,
    title: "Location settings disabled",
    description: "Please enable Location settings in your phone settings to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.LocationServicePermissionMissing,
    title: "Location permission needed",
    description: "Please enable Location permission to use Bluetooth",
  },
  {
    type: DiscoveryErrorTypes.Unknown,
    title: "Unable to discover devices",
    description: "Unable to discover devices.",
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
}: {
  type: DiscoveryErrorTypes;
  retry?: DiscoveryErrorUIState["retry"];
}) {
  const ignore = jest.fn();
  const state: DiscoveryErrorUIState = {
    type: ConnectDeviceUIStateTypes.DiscoveryError,
    error: makeDiscoveryError(type),
    retry,
    ignore,
  };

  const view = render(<DiscoveryErrorState state={state} />);

  return { ...view, ignore };
}

describe("DiscoveryErrorState", () => {
  it.each(errorCases)(
    "should render the $type error title and description",
    ({ type, title, description }) => {
      renderState({ type });

      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
    },
  );

  it("should render retry when a retry callback is available", async () => {
    const retry = jest.fn();
    const { user } = renderState({
      type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
      retry,
    });

    await user.press(screen.getByText("Try again"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry when no retry callback is available", () => {
    renderState({ type: DiscoveryErrorTypes.BluetoothUnsupported });

    expect(screen.queryByText("Try again")).toBeNull();
  });

  it("should render continue with USB for known discovery errors", async () => {
    const { user, ignore } = renderState({
      type: DiscoveryErrorTypes.LocationDisabledManualAction,
    });

    await user.press(screen.getByText("I want to continue with USB"));

    expect(ignore).toHaveBeenCalledTimes(1);
  });

  it("should render close for unknown discovery errors", async () => {
    const { user, ignore } = renderState({ type: DiscoveryErrorTypes.Unknown });

    await user.press(screen.getByText("Close"));

    expect(ignore).toHaveBeenCalledTimes(1);
  });
});
