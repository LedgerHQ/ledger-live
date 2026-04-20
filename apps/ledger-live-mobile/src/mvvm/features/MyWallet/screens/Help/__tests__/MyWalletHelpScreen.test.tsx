import React from "react";
import { render, screen } from "@tests/test-renderer";
import { MyWalletHelpScreen } from "../index";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  TrackScreen: () => null,
}));

describe("MyWalletHelpScreen", () => {
  it("should render both section headers", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByText("Support and learning")).toBeVisible();
    expect(screen.getByText("More")).toBeVisible();
  });

  it("should render the scrollable container", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByTestId("my-wallet-help-screen")).toBeVisible();
  });
});
