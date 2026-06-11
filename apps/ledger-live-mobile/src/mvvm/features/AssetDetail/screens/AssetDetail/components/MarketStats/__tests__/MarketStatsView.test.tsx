import React from "react";
import { GlobalTooltipBottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { render, screen, waitFor } from "@tests/test-renderer";
import { MarketStatsView } from "../MarketStatsView";

const stats = [
  {
    key: "max_supply",
    label: "Max supply",
    value: "21M BTC",
    tooltip: {
      title: "Max supply",
      content: "The maximum number of tokens that will ever exist.",
    },
  },
  {
    key: "trading_volume",
    label: "24h trading volume",
    value: "$25B",
    tooltip: {
      title: "24h trading volume",
      content: "The total amount traded in the last 24 hours.",
    },
  },
];

function renderMarketStatsView() {
  const onTooltipOpen = jest.fn();
  const rendered = render(
    <>
      <MarketStatsView
        stats={stats}
        isLoading={false}
        isError={false}
        hasData
        onTooltipOpen={onTooltipOpen}
      />
      <GlobalTooltipBottomSheet />
    </>,
  );

  return { ...rendered, onTooltipOpen };
}

describe("MarketStatsView", () => {
  it("should render market stat tooltip definitions as bottom sheet text", async () => {
    const { user, onTooltipOpen } = renderMarketStatsView();

    await user.press(screen.getByLabelText("Max supply"));

    await waitFor(() => {
      expect(screen.getAllByText("Max supply")[1]).toBeVisible();
      expect(screen.getByText("The maximum number of tokens that will ever exist.")).toBeVisible();
    });
    expect(onTooltipOpen).toHaveBeenCalledWith("max_supply", true);

    await user.press(screen.getByLabelText("24h trading volume"));

    await waitFor(() => {
      expect(screen.getAllByText("24h trading volume")[1]).toBeVisible();
      expect(screen.getByText("The total amount traded in the last 24 hours.")).toBeVisible();
    });
    expect(onTooltipOpen).toHaveBeenCalledWith("trading_volume", true);
  });
});
