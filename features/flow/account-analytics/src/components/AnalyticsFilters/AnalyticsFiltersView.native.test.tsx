import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AnalyticsFiltersView } from "./AnalyticsFiltersView";
import type { AnalyticsFilterViewProps } from "./AnalyticsFiltersView.types";

jest.mock("@ledgerhq/crypto-icons/native", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return ({ ledgerId }: Readonly<{ ledgerId: string }>) => (
    <View testID={`crypto-icon-${ledgerId}`} />
  );
});
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const mocks = jest.requireActual<typeof import("../../__tests__/nativeLumenMocks")>(
    "../../__tests__/nativeLumenMocks",
  );
  const overrides: Record<string, unknown> = {
    SelectList: mocks.MockSelectList,
    SelectListContent: mocks.MockSelectListContent,
    SelectListItem: mocks.MockSelectListItem,
  };
  return new Proxy(actual, { get: (target, prop: string) => overrides[prop] ?? target[prop] });
});

function createAssetFilter(
  overrides: Partial<AnalyticsFilterViewProps> = {},
): AnalyticsFilterViewProps {
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
    ...overrides,
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
    ],
    value: "",
    triggerLabel: "All accounts",
    selectedMeta: undefined,
    disabled: false,
    onOpenChange: jest.fn(),
    onValueChange: jest.fn(),
  };
}

describe("AnalyticsFiltersView (native)", () => {
  it("should show only the asset filter until an asset is selected", () => {
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={null} />);
    expect(screen.getByTestId("analytics-asset-filter")).toBeVisible();
    expect(screen.queryByTestId("analytics-account-filter")).toBeNull();
  });

  it("should label each chip with its filter and selected value", () => {
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={createAccountFilter()} />);
    expect(screen.getByTestId("analytics-asset-filter")).toHaveProp(
      "accessibilityLabel",
      "Asset filter, USD Coin",
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveProp(
      "accessibilityLabel",
      "Account filter, Savings",
    );
  });

  it("should open the sheet and report the opening when a chip is pressed", async () => {
    const asset = createAssetFilter();
    render(<AnalyticsFiltersView asset={asset} account={null} />);
    expect(screen.getByTestId("analytics-asset-filter-sheet")).not.toBeExpanded();

    await userEvent.press(screen.getByTestId("analytics-asset-filter"));

    expect(screen.getByTestId("analytics-asset-filter-sheet")).toBeExpanded();
    expect(asset.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("should select an option, then close the sheet", async () => {
    const asset = createAssetFilter({ value: "" });
    render(<AnalyticsFiltersView asset={asset} account={null} />);
    await userEvent.press(screen.getByTestId("analytics-asset-filter"));

    await userEvent.press(screen.getByTestId("analytics-asset-filter-option-usdc"));

    expect(asset.onValueChange).toHaveBeenCalledWith("usdc");
    expect(screen.getByTestId("analytics-asset-filter-sheet")).not.toBeExpanded();
    expect(asset.onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("should render each option with its icon, or the fallback for the All option", () => {
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={createAccountFilter()} />);
    expect(screen.getByTestId("analytics-asset-filter-option-all")).toBeVisible();
    expect(screen.getAllByTestId("crypto-icon-ethereum/erc20/usdc")).not.toHaveLength(0);
    expect(screen.getByTestId("analytics-account-filter-option-eth-account")).toHaveProp(
      "accessibilityLabel",
      "Savings (Ethereum)",
    );
    expect(screen.getByTestId("analytics-account-filter-option-all")).toBeSelected();
  });

  it("should show the selected icon on both the asset and account chips", () => {
    render(
      <AnalyticsFiltersView
        asset={createAssetFilter()}
        account={{ ...createAccountFilter(), selectedMeta: { iconId: "ethereum", ticker: "ETH" } }}
      />,
    );
    expect(screen.getByTestId("analytics-asset-filter")).toHaveProp(
      "leadingContent",
      expect.anything(),
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveProp(
      "leadingContent",
      expect.anything(),
    );
  });

  it("should show no icon on the account chip while all accounts are selected", () => {
    render(<AnalyticsFiltersView asset={createAssetFilter()} account={createAccountFilter()} />);
    expect(screen.getByTestId("analytics-account-filter")).toHaveProp("leadingContent", undefined);
  });
});
