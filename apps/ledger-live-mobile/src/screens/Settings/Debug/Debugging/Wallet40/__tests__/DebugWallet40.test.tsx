import React from "react";
import { render, screen } from "@tests/test-renderer";
import DebugWallet40 from "../index";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe("DebugWallet40", () => {
  it("should keep Wallet V4 Tour and omit Product, Q2, and Q3 tours", () => {
    render(<DebugWallet40 />);

    expect(screen.getByText("Wallet V4 Tour")).toBeVisible();
    expect(screen.queryByText("Product Tour")).toBeNull();
    expect(screen.queryByText("Q2 Wallet V4 Tour (Images)")).toBeNull();
    expect(screen.queryByText("Q3 Wallet V4 Tour")).toBeNull();
    expect(screen.queryByText(/PRODUCT TOUR — QA/)).toBeNull();
  });
});
