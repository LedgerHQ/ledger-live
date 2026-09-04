import React from "react";
import { View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import type { BalanceViewProps } from "../types";
import { BalanceView } from "../components/Hero/BalanceView.native";
import { i18nWrapper } from "./i18nWrapper";
import {
  depositActionTiles,
  emptyLabels,
  filterLabels,
  formatCountervalue,
  options,
} from "./fixtures";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      {children}
    </View>
  ),
}));

function fundedProps(): BalanceViewProps {
  return {
    displayMode: "funded",
    balance: 1000,
    formatCountervalue,
    isLoading: false,
    labels: filterLabels,
    filter: "all",
    options,
    isFilterOpen: false,
    onOpenFilter: jest.fn(),
    onCloseFilter: jest.fn(),
    onConfirmFilter: jest.fn(),
  };
}

function renderView(props: BalanceViewProps) {
  return render(<BalanceView {...props} />, { wrapper: i18nWrapper() });
}

describe("BalanceView (Native)", () => {
  it("should render the empty title and description when empty", () => {
    renderView({ displayMode: "empty", labels: emptyLabels });

    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });

  it("should not render a balance when empty", () => {
    renderView({ displayMode: "empty", labels: emptyLabels });

    expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
  });

  it("should render the funded balance when funded", () => {
    renderView(fundedProps());

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
  });

  it("should render action tiles when empty", () => {
    renderView({ displayMode: "empty", labels: emptyLabels, actionTiles: depositActionTiles });

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });

  it("should render action tiles when funded", () => {
    renderView({ ...fundedProps(), actionTiles: depositActionTiles });

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });
});
