import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UnsupportedFeatureView } from "./UnsupportedFeatureView";

function renderView() {
  const onContactSupport = jest.fn();

  return {
    ...render(<UnsupportedFeatureView onContactSupport={onContactSupport} />),
    onContactSupport,
  };
}

describe("UnsupportedFeatureView", () => {
  it("should render the unsupported feature copy and contact support cta", () => {
    renderView();

    expect(screen.getByText("Unsupported feature")).toBeVisible();
    expect(
      screen.getByText(
        "The app required for this operation is not currently available on your Ledger device. Please contact Ledger support for details.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Contact Ledger support")).toBeVisible();
  });

  it("should call onContactSupport when the primary action is pressed", async () => {
    const { user, onContactSupport } = renderView();

    await user.press(screen.getByText("Contact Ledger support"));

    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });
});
