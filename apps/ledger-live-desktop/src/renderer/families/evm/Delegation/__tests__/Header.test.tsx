import React from "react";
import { render, screen } from "tests/testSetup";
import { Header } from "../Header";

describe("evm/Delegation/Header", () => {
  it("renders the rewards column when showRewards is true", () => {
    render(<Header showRewards={true} />);
    expect(screen.getByText("Rewards")).toBeInTheDocument();
  });

  it("omits the rewards column when showRewards is false", () => {
    render(<Header showRewards={false} />);
    expect(screen.queryByText("Rewards")).toBeNull();
  });
});
