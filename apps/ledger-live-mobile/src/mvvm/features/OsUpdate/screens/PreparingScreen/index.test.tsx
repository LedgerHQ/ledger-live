import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PreparingScreen } from ".";

describe("PreparingScreen", () => {
  it("shows the preparing title", () => {
    render(<PreparingScreen />);

    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    expect(screen.getByText("Preparing for install")).toBeVisible();
  });
});
