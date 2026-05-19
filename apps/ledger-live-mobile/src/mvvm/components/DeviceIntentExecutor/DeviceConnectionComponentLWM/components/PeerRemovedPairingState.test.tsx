import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PeerRemovedPairingState } from "./PeerRemovedPairingState";

function renderState() {
  const onHelp = jest.fn();
  const onRetry = jest.fn();

  const view = render(
    <PeerRemovedPairingState
      title="Go to your phone's Bluetooth settings to unpair Ledger device"
      description="Remove Ledger device from your phone's Bluetooth list, then return to this app and try again."
      helpLabel="Learn how to fix"
      retryLabel="I unpaired, try again"
      onHelp={onHelp}
      onRetry={onRetry}
    />,
  );

  return { ...view, onHelp, onRetry };
}

describe("PeerRemovedPairingState", () => {
  it("should render the peer removed pairing content", () => {
    renderState();

    expect(
      screen.getByText("Go to your phone's Bluetooth settings to unpair Ledger device"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Remove Ledger device from your phone's Bluetooth list, then return to this app and try again.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Learn how to fix")).toBeVisible();
    expect(screen.getByText("I unpaired, try again")).toBeVisible();
    expect(screen.getByTestId("peer-removed-help-external-link-icon")).toBeVisible();
  });

  it("should call the help action when the help button is pressed", async () => {
    const { user, onHelp } = renderState();

    await user.press(screen.getByText("Learn how to fix"));

    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it("should call the retry action when the retry link is pressed", async () => {
    const { user, onRetry } = renderState();

    await user.press(screen.getByText("I unpaired, try again"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
