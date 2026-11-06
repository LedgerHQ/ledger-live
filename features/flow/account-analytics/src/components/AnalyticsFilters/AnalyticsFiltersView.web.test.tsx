import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsFiltersView } from "./AnalyticsFiltersView";
import type { AnalyticsFilterViewProps } from "./AnalyticsFiltersView.types";

function createAssetFilter(): AnalyticsFilterViewProps {
  return {
    ariaLabel: "Asset filter, USD Coin",
    items: [
      { value: "", label: "All assets" },
      { value: "usdc", label: "USD Coin", meta: { iconId: "ethereum/erc20/usdc", ticker: "USDC" } },
    ],
    value: "usdc",
    triggerLabel: "USD Coin",
    selectedMeta: { iconId: "ethereum/erc20/usdc", ticker: "USDC" },
    disabled: false,
    onOpenChange: jest.fn(),
    onValueChange: jest.fn(),
  };
}

function createAccountFilter(): AnalyticsFilterViewProps {
  return {
    ariaLabel: "Account filter, Savings",
    items: [
      { value: "", label: "All accounts" },
      {
        value: "eth-account",
        label: "Savings",
        meta: { iconId: "ethereum", ticker: "ETH", networkName: "Ethereum" },
      },
      {
        value: "tron-account",
        label: "Savings",
        meta: { iconId: "tron", ticker: "TRX", networkName: "Tron" },
      },
    ],
    value: "tron-account",
    triggerLabel: "Savings",
    disabled: false,
    onOpenChange: jest.fn(),
    onValueChange: jest.fn(),
  };
}

describe("AnalyticsFiltersView (Web)", () => {
  it("should render only the asset filter when no account filter is offered", () => {
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={null} />);
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("USD Coin");
    expect(screen.queryByTestId("analytics-account-filter")).not.toBeInTheDocument();
  });

  it("should report the asset picked from its options", async () => {
    const user = userEvent.setup();
    const asset = createAssetFilter();
    render(<AnalyticsFiltersView asset={asset} account={null} />);
    expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual([
      "All assets",
      "USD Coin",
    ]);
    await user.click(screen.getByRole("option", { name: "All assets" }));
    expect(asset.onValueChange).toHaveBeenCalledWith("");
  });

  it("should tell same-named accounts apart by their network", async () => {
    const user = userEvent.setup();
    const account = createAccountFilter();
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={account} />);
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Savings");
    expect(screen.getByTestId("analytics-account-filter")).toHaveAccessibleName(
      "Account filter, Savings",
    );
    const accountOptions = within(screen.getAllByRole("listbox")[1]);
    expect(accountOptions.getByRole("option", { name: "Savings (Tron)" })).toBeInTheDocument();
    await user.click(accountOptions.getByRole("option", { name: "Savings (Ethereum)" }));
    expect(account.onValueChange).toHaveBeenCalledWith("eth-account");
  });
});
