import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { UnsupportedFeatureView } from "./UnsupportedFeatureView";

describe("UnsupportedFeatureView", () => {
  const renderView = () => {
    const onContactSupport = jest.fn();
    const { user } = render(<UnsupportedFeatureView onContactSupport={onContactSupport} />);
    return { user, onContactSupport };
  };

  it("GIVEN the unsupported feature view WHEN rendering THEN it shows the unsupported feature copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Unsupported feature")).toBeVisible();
  });

  it("GIVEN the unsupported feature view WHEN clicking Contact Ledger support THEN it calls support", async () => {
    // GIVEN
    const { user, onContactSupport } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Contact Ledger support" }));

    // THEN
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });
});
