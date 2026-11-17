import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { ChartSectionView } from "../ChartSectionView";
import { useChartSectionModel } from "../useChartSectionModel";
import { CHART_SECTION_TEST_IDS, type ChartSectionSlots } from "../types";
import { chartSectionInitialState } from "./fixtures";

function TestChartSection(slots: ChartSectionSlots) {
  const viewModel = useChartSectionModel({
    prices: [1000, 1200],
    timestamps: [1, 2],
    valueChange: { value: 200, percentage: 0.2 },
    isVariationAvailable: true,
    isChartLoading: false,
    balance: { amount: 1200, isLoading: false, isAvailable: true },
  });
  return <ChartSectionView viewModel={viewModel} {...slots} />;
}

function renderSection(slots: ChartSectionSlots = {}) {
  render(<TestChartSection {...slots} />, { overrideInitialState: chartSectionInitialState });
}

describe("ChartSectionView", () => {
  it("should render the balance header with the filters under it", () => {
    renderSection({ filters: <Text>Filters</Text> });
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.header)).toBeVisible();
    expect(screen.getByText("Filters")).toBeVisible();
  });

  it("should replace the balance header with the header content", () => {
    renderSection({ headerContent: <Text>Header status</Text> });
    expect(screen.getByText("Header status")).toBeVisible();
    expect(screen.queryByTestId(CHART_SECTION_TEST_IDS.header)).toBeNull();
  });

  it("should replace the plot with the plot content", () => {
    renderSection({ plotContent: <Text>Plot status</Text> });
    expect(screen.getByText("Plot status")).toBeVisible();
  });
});
