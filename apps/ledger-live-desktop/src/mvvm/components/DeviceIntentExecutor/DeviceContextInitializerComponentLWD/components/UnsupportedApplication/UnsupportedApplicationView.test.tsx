import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { UnsupportedApplicationView } from "./UnsupportedApplicationView";

describe("UnsupportedApplicationView", () => {
  const renderView = () => {
    const onContactSupport = jest.fn();
    const { user } = render(<UnsupportedApplicationView onContactSupport={onContactSupport} />);
    return { user, onContactSupport };
  };

  it("GIVEN the unsupported application view WHEN rendering THEN it shows the unsupported feature copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Unsupported feature")).toBeVisible();
  });

  it("GIVEN the unsupported application view WHEN clicking Contact Ledger support THEN it calls support", async () => {
    // GIVEN
    const { user, onContactSupport } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Contact Ledger support" }));

    // THEN
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });
});
