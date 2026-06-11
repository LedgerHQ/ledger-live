import React from "react";
import { screen } from "tests/testSetup";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketRowView, MarketRowViewProps } from "../MarketRowView";
import { mockT, renderInTable } from "../../__tests__/shared";

const mockCurrency = MOCK_MARKET_CURRENCY_DATA[0];

const renderRow = (props: MarketRowViewProps) =>
  renderInTable(<MarketRowView {...props} />, { withBody: true });

function createProps(overrides: Partial<MarketRowViewProps> = {}): MarketRowViewProps {
  return {
    style: {},
    currency: mockCurrency,
    isStarred: false,
    priceChangePercentage: 2.5,
    formattedPrice: "$50,000.00",
    formattedVolume: "$50M",
    formattedMarketCap: "$1B",
    onCurrencyClick: jest.fn(),
    swapAction: { available: false, onClick: jest.fn() },
    buySellAction: { available: false, onClick: jest.fn() },
    earnAction: { available: false, onClick: jest.fn(), label: "Earn" },
    onFavouriteSelect: jest.fn(),
    onMenuOpenChange: jest.fn(),
    t: mockT,
    ...overrides,
  };
}

describe("MarketRowView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render currency name and uppercased ticker", () => {
    renderRow(createProps());

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });

  it("should render the marketcap rank tag", () => {
    renderRow(createProps());
    expect(screen.getByText("#1")).toBeVisible();
  });

  it("should not render the rank tag when marketcapRank is absent", () => {
    const currency = { ...mockCurrency, marketcapRank: 0 };
    renderRow(createProps({ currency }));
    expect(screen.queryByText("#1")).toBeNull();
  });

  it("should render formatted price, volume and market cap", () => {
    renderRow(createProps());

    expect(screen.getByTestId("market-coin-price")).toHaveTextContent("$50,000.00");
    expect(screen.getByTestId("market-volume")).toHaveTextContent("$50M");
    expect(screen.getByTestId("market-cap")).toHaveTextContent("$1B");
  });

  it("should render the image fallback when ledgerIds is empty", () => {
    const currency = { ...mockCurrency, ledgerIds: [] };
    renderRow(createProps({ currency }));
    expect(screen.getByAltText("Bitcoin")).toBeVisible();
  });

  it("should render '-' when priceChangePercentage is undefined", () => {
    renderRow(createProps({ priceChangePercentage: undefined }));
    expect(screen.getByTestId("market-price-change")).toHaveTextContent("-");
  });

  it("should render the trend when priceChangePercentage is defined", () => {
    renderRow(createProps({ priceChangePercentage: 5.5 }));
    expect(screen.getByTestId("market-price-change")).not.toHaveTextContent("-");
  });

  it("should call onCurrencyClick when the row is clicked", async () => {
    const onCurrencyClick = jest.fn();
    const { user } = renderRow(createProps({ onCurrencyClick }));

    await user.click(screen.getByTestId("market-BTC-row"));
    expect(onCurrencyClick).toHaveBeenCalledTimes(1);
  });
});
