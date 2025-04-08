import React from "react";
import { render } from "@tests/test-renderer";
import { LargeMoverGraph } from "./LargeMoverGraph";
import { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";

const mockChartData: MarketCoinDataChart = {
  "24h": [
    [1681017600000, 60000],
    [1681104000000, 60500],
    [1681190400000, 59000],
    [1681276800000, 62000],
    [1681363200000, 61000],
  ],
  "7d": [
    [1680528000000, 59000],
    [1680614400000, 60000],
    [1680700800000, 61000],
    [1680787200000, 62000],
    [1680873600000, 62500],
    [1680960000000, 61500],
    [1681046400000, 63000],
  ],
};

describe("LargeMoverGraph", () => {
  it("renders the graph with the correct data", () => {
    const { getByTestId } = render(
      <LargeMoverGraph chartData={mockChartData} range="24h" currencyId="bitcoin" />,
    );

    const graph = getByTestId("LargeMoverGraph");
    expect(graph).toBeTruthy();
  });

  it("updates the graph when range changes", () => {
    const { getByTestId, rerender } = render(
      <LargeMoverGraph chartData={mockChartData} range="24h" currencyId="bitcoin" />,
    );

    const graph = getByTestId("LargeMoverGraph");
    expect(graph).toBeTruthy();

    rerender(<LargeMoverGraph chartData={mockChartData} range="7d" currencyId="bitcoin" />);

    const updatedGraph = getByTestId("LargeMoverGraph");
    expect(updatedGraph).toBeTruthy();
  });
});
