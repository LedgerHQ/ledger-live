import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { InvalidProviderView } from "./InvalidProviderView";

describe("InvalidProviderView", () => {
  const renderView = () => {
    const onGoToSettings = jest.fn();
    const { user } = render(<InvalidProviderView onGoToSettings={onGoToSettings} />);
    return { user, onGoToSettings };
  };

  it("GIVEN the invalid provider view WHEN rendering THEN it shows the invalid provider copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Invalid Provider")).toBeVisible();
  });

  it("GIVEN the invalid provider view WHEN clicking Go to settings THEN it calls the settings action", async () => {
    // GIVEN
    const { user, onGoToSettings } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Go to settings" }));

    // THEN
    expect(onGoToSettings).toHaveBeenCalledTimes(1);
  });
});
