import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketPriceSectionView } from "../MarketPriceSectionView";
import type { MarketPriceSectionViewModelResult } from "../useMarketPriceSectionViewModel";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-react");
  return {
    ...actual,
    AmountDisplay: ({
      value,
      animate,
      ["data-testid"]: testId,
    }: {
      value: number;
      animate?: boolean;
      "data-testid"?: string;
    }) => (
      <span data-testid={testId} data-animate={String(animate)}>
        {value}
      </span>
    ),
  };
});

const baseViewModel: MarketPriceSectionViewModelResult = {
  title: "Market price",
  rangeLabel: "1 day",
  priceValue: 12.34,
  priceFormatter: jest.fn() as unknown as MarketPriceSectionViewModelResult["priceFormatter"],
  variationText: "$0.22",
  percentageText: "+1.80%",
  variationVariant: "positive" as const,
  showSkeleton: false,
  hasPriceData: true,
  hasVariationData: true,
  isScrubbing: false,
};

describe("MarketPriceSectionView", () => {
  it("shows a longer placeholder and day label when market price is unavailable", () => {
    render(
      <MarketPriceSectionView
        {...baseViewModel}
        hasPriceData={false}
        hasVariationData={false}
        priceValue={undefined}
      />,
    );

    expect(screen.getByTestId("asset-detail-market-price")).toHaveTextContent("-----");
    expect(screen.queryByTestId("asset-detail-market-price-percent")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("asset-detail-market-price-fiat-variation"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeVisible();
  });

  it("animates the amount and shows the range label when not scrubbing", () => {
    render(<MarketPriceSectionView {...baseViewModel} />);

    expect(screen.getByTestId("asset-detail-market-price")).toHaveAttribute("data-animate", "true");
    expect(screen.getByText("1 day")).toBeVisible();
  });

  it("disables the amount animation, shows scrub variation metrics, and shows the scrubbed date while scrubbing", () => {
    render(
      <MarketPriceSectionView
        {...baseViewModel}
        priceValue={99.99}
        isScrubbing
        scrubbedDateLabel="Jan 1, 2024"
      />,
    );

    const amount = screen.getByTestId("asset-detail-market-price");
    expect(amount).toHaveTextContent("99.99");
    expect(amount).toHaveAttribute("data-animate", "false");
    expect(screen.getByText("Jan 1, 2024")).toBeVisible();
    expect(screen.queryByText("1 day")).not.toBeInTheDocument();
    expect(screen.getByTestId("asset-detail-market-price-percent")).toHaveTextContent("+1.80%");
    expect(screen.getByTestId("asset-detail-market-price-fiat-variation")).toHaveTextContent(
      "$0.22",
    );
  });
});
