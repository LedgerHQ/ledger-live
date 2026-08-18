import React from "react";
import { render, screen } from "tests/testSetup";
import { Header } from "../Header";

describe("evm/Delegation/Header", () => {
  it("renders the rewards column", () => {
    render(<Header />);
    expect(screen.getByText("Rewards")).toBeVisible();
  });
});
