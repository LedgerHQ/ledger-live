import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseConnectionErrorTypes,
  ConnectionErrorTypes,
  ConnectivityUIStateTypes,
  rnBleTransportIdentifier,
  type ConnectionError,
} from "@ledgerhq/live-dmk-mobile";
import type { ConnectionErrorUIState } from "@ledgerhq/live-dmk-shared";
import { urls } from "~/utils/urls";
import { ConnectionErrorState } from "./ConnectionErrorState";

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
    type: BaseConnectionErrorTypes.Unknown,
    title: "Pairing unsuccessful",
    description:
      "Please try again or read our Bluetooth troubleshooting article below for more guidance.",
    cta: "Try again",
  },
] as const;

function renderState(errorType: ConnectionError["type"]) {
  const retry = jest.fn();
  const onHelpPress = jest.fn();
  const state: ConnectionErrorUIState<ConnectionError> = {
    type: ConnectivityUIStateTypes.ConnectionError,
    error: { type: errorType },
    device: {
      id: "device-id",
      name: "Ledger Nano X",
      deviceModelId: DeviceModelId.nanoX,
      transport: rnBleTransportIdentifier,
    },
    retry,
    ignore: jest.fn(),
  };

  const view = render(<ConnectionErrorState state={state} onHelpPress={onHelpPress} />);

  return { ...view, retry, onHelpPress };
}

describe("ConnectionErrorState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it.each(errorCases)("should render the $type error title and CTA", ({ type, title, cta }) => {
    renderState(type);

    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(cta)).toBeVisible();
  });

  it.each(errorCases.filter(({ description }) => description))(
    "GIVEN a $type error with a description WHEN rendering THEN it renders the error description",
    ({ type, description }) => {
      // GIVEN
      if (!description) {
        throw new Error("Expected error case to include a description");
      }

      // WHEN
      renderState(type);

      // THEN
      expect(screen.getByText(description)).toBeVisible();
    },
  );

  it("should render the unknown error tip", () => {
    renderState(BaseConnectionErrorTypes.Unknown);

    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("should call retry when the retry button is pressed", async () => {
    const { user, retry } = renderState(BaseConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Try again"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should open the generic pairing help article when help is pressed", async () => {
    const { user, onHelpPress } = renderState(BaseConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Get help"));

    expect(onHelpPress).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(urls.pairingIssues);
  });

  it("should open the forget device article when peer removed pairing help is pressed", async () => {
    const { user, onHelpPress } = renderState(ConnectionErrorTypes.BlePairingPeerRemovedPairing);

    await user.press(screen.getByText("Learn how to fix"));

    expect(onHelpPress).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(urls.errors.BleForgetDevice);
  });

  it("should call retry when peer removed pairing retry is pressed", async () => {
    const { user, retry } = renderState(ConnectionErrorTypes.BlePairingPeerRemovedPairing);

    await user.press(screen.getByText("I unpaired, try again"));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
