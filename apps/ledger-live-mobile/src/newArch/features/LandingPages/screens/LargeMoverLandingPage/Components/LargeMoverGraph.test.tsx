import React from "react";
import { render } from "@tests/test-renderer";
import { LargeMoverGraph } from "./LargeMoverGraph";
import { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import Graph from "~/components/Graph";
import { Flex } from "@ledgerhq/native-ui";

jest.mock("~/components/Graph", () => {
  return jest.fn(() => {
    return <Flex testID="large-mover-graph" />;
  });
});


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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the graph with the correct data", () => {
    const { getByTestId } = render(
      <LargeMoverGraph chartData={mockChartData} range="24h" currencyId="bitcoin" />,
    );

    const graph = getByTestId("large-mover-graph");
    expect(graph).toBeTruthy();
  });

  it("updates the graph when range changes and passes correct data", () => {
    const { rerender } = render(
      <LargeMoverGraph chartData={mockChartData} range="24h" currencyId="bitcoin" />,
    );

    expect(Graph).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockChartData["24h"].map(d => ({
          date: new Date(d[0]),
          value: d[1],
        })),
      }),
      expect.anything(),
    );

    rerender(<LargeMoverGraph chartData={mockChartData} range="7d" currencyId="bitcoin" />);

    expect(Graph).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: mockChartData["7d"].map(d => ({
          date: new Date(d[0]),
          value: d[1],
        })),
      }),
      expect.anything(),
    );
  });
});
