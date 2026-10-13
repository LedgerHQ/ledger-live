import React from "react";
import { render, screen } from "@tests/test-renderer";
import { OfferScreen } from "./index";

function renderOffer() {
  const onActivate = jest.fn();
  const onSkip = jest.fn();
  const onLearnMore = jest.fn();
  const onQuit = jest.fn();

  return {
    ...render(
      <OfferScreen
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

describe("OfferView", () => {
  it("should activate synchronisation from the primary action", async () => {
    const { user, onActivate, onSkip } = renderOffer();

    expect(screen.getByText("Activate synchronisation")).toBeVisible();
    expect(
      screen.getByText(/Make sure that your balance and portfolio remain up-to-date/),
    ).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Activate" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should skip without activating", async () => {
    const { user, onSkip, onActivate } = renderOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("should open learn more and leave from the header", async () => {
    const { user, onLearnMore, onQuit, onActivate } = renderOffer();

    await user.press(screen.getByRole("link", { name: "Learn more" }));
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onLearnMore).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });
});
