import React from "react";
import { render, screen } from "@tests/test-renderer";
import { useShouldDisplayAnalyticsPnl } from "LLM/features/Analytics/hooks/useShouldDisplayAnalyticsPnl";
import MainGraph from "../MainGraph";

jest.mock("LLM/features/Analytics/hooks/useShouldDisplayAnalyticsPnl");
jest.mock("../ChartSection", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="analytics-chart-section" />,
  };
});
jest.mock("~/screens/Portfolio/PortfolioGraphCard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="legacy-portfolio-graph-card" />,
  };
});

const mockUseShouldDisplayAnalyticsPnl = jest.mocked(useShouldDisplayAnalyticsPnl);

describe("MainGraph", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ChartSection when the PnL flag is on and accounts exist", () => {
    mockUseShouldDisplayAnalyticsPnl.mockReturnValue(true);

    render(<MainGraph />);

    expect(screen.getByTestId("analytics-chart-section")).toBeVisible();
    expect(screen.queryByTestId("legacy-portfolio-graph-card")).toBeNull();
  });

  it("renders the legacy portfolio graph when PnL is hidden", () => {
    mockUseShouldDisplayAnalyticsPnl.mockReturnValue(false);

    render(<MainGraph />);

    expect(screen.getByTestId("legacy-portfolio-graph-card")).toBeVisible();
    expect(screen.queryByTestId("analytics-chart-section")).toBeNull();
  });
});
