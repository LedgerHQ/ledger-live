import React from "react";
import { render, screen } from "../../__tests__/render";
import { PreparingScreen } from "./PreparingScreen";

describe("PreparingScreen", () => {
  it("shows the preparing title", () => {
    render(<PreparingScreen />);

    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
    expect(screen.getByText("Preparing update...")).toBeVisible();
  });
});
