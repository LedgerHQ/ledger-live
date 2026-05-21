import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { urls } from "~/utils/urls";
import { ConnectionErrorState } from "./ConnectionErrorState";

type ConnectionErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.ConnectionError }
>;

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
    retry,
    ignore,
  };

  const view = render(<ConnectionErrorState state={state} />);

  return { ...view, retry, ignore };
}

describe("ConnectionErrorState", () => {
  beforeEach(() => {
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

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should open the generic pairing help article", async () => {
    const { user } = renderState(ConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Get help"));

    expect(Linking.openURL).toHaveBeenCalledWith(urls.pairingIssues);
  });
});
