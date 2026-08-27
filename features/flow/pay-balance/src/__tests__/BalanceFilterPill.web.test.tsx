import React from "react";
import { screen } from "@testing-library/react";
import { BalanceFilterPill } from "../components/Filter/BalanceFilterPill.web";
import { usdcOption } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

describe("BalanceFilterPill (Web)", () => {
  it("should render the all-stablecoins label when nothing is selected", () => {
    renderWithStyle(
      <BalanceFilterPill allStablecoinsLabel="All stablecoins" onClick={jest.fn()} />,
    );

    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    expect(screen.getByText("All stablecoins")).toBeVisible();
  });

  it("should render the selected ticker when an option is selected", () => {
    renderWithStyle(
      <BalanceFilterPill
        allStablecoinsLabel="All stablecoins"
        selectedOption={usdcOption}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByText("USDC")).toBeVisible();
    expect(screen.queryByText("All stablecoins")).not.toBeInTheDocument();
  });

  it("should call onClick when pressed", async () => {
    const onClick = jest.fn();
    renderWithStyle(<BalanceFilterPill allStablecoinsLabel="All stablecoins" onClick={onClick} />);

    await screen.getByTestId("pay-card-balance-filter-pill").click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
