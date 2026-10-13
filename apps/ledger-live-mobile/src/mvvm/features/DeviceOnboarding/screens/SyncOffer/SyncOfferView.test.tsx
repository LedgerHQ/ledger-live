import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SyncOfferScreen } from "./index";

function renderSyncOffer() {
  const onActivate = jest.fn();
  const onSkip = jest.fn();
  const onLearnMore = jest.fn();
  const onQuit = jest.fn();

  return {
    ...render(
      <SyncOfferScreen
        onActivate={onActivate}
        onSkip={onSkip}
        onLearnMore={onLearnMore}
        onQuit={onQuit}
      />,
    ),
    onActivate,
    onSkip,
    onLearnMore,
    onQuit,
  };
}

describe("SyncOfferView", () => {
  it("should activate synchronisation from the primary action", async () => {
    const { user, onActivate, onSkip } = renderSyncOffer();

    expect(screen.getByText("Sync your wallet")).toBeVisible();
    expect(
      screen.getByText(
        /Keep your balance and portfolio in sync when switching phones or using a computer\./,
      ),
    ).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Activate" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should skip without activating", async () => {
    const { user, onSkip, onActivate } = renderSyncOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("should open learn more and leave from the header", async () => {
    const { user, onLearnMore, onQuit, onActivate } = renderSyncOffer();

    await user.press(screen.getByRole("link", { name: "Learn more" }));
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onLearnMore).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });
});
