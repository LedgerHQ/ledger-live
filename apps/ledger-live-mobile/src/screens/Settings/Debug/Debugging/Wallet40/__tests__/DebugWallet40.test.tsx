import React from "react";
import { render, screen } from "@tests/test-renderer";
import DebugWallet40 from "../index";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe("DebugWallet40", () => {
  it("shows Wallet 4.0 debug controls and Q2/Q3 tour shortcuts", async () => {
    render(<DebugWallet40 />);

    expect(
      await screen.findByText("Toggle Wallet 4.0 features for development and testing"),
    ).toBeTruthy();
    expect(screen.getByText("Wallet V4 Tour")).toBeTruthy();
    expect(screen.getByText("Q2 Wallet V4 Tour (Images)")).toBeTruthy();
    expect(screen.queryByText("Product Tour")).toBeNull();
  });
});
