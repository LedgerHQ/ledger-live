import React from "react";
import { render, screen } from "tests/testSetup";
import { ListData } from "../ListData";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";

jest.mock("../RowItem/useRowItemViewModel", () => ({
  useRowItemViewModel: ({ toggleStar }: { toggleStar: () => void }) => ({
    onCurrencyClick: jest.fn(),
    onStarClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    },
    actions: [],
    hasActions: false,
    currentPriceChangePercentage: 2.5,
  }),
}));

function createVirtualItem(index: number, start: number, size: number) {
  return { index, start, size, end: start + size, key: index, lane: 0 };
}

describe("ListData", () => {
  const starredMarketCoins: string[] = [];
  const defaultProps = {
    marketData: MOCK_MARKET_CURRENCY_DATA,
    starredMarketCoins,
    counterCurrency: "usd",
    locale: "en",
    range: "24h",
    toggleStar: jest.fn(),
    totalSize: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all currencies from virtualizer items", () => {
    const virtualItems = [createVirtualItem(0, 0, 50), createVirtualItem(1, 50, 50)];

    render(<ListData {...defaultProps} virtualItems={virtualItems} />);

    expect(screen.getByTestId("market-BTC-row")).toBeVisible();
    expect(screen.getByTestId("market-ETH-row")).toBeVisible();
  });

  it("should render currency name and ticker", () => {
    render(<ListData {...defaultProps} virtualItems={[createVirtualItem(0, 0, 50)]} />);

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });

  it("should skip rendering when currency is undefined", () => {
    const virtualItems = [createVirtualItem(0, 0, 50), createVirtualItem(5, 50, 50)];

    render(<ListData {...defaultProps} virtualItems={virtualItems} />);

    expect(screen.getByTestId("market-BTC-row")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("should render star button for starred currency", () => {
    render(
      <ListData
        {...defaultProps}
        starredMarketCoins={["bitcoin"]}
        virtualItems={[createVirtualItem(0, 0, 50)]}
      />,
    );

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should render star button for non-starred currency", () => {
    render(<ListData {...defaultProps} virtualItems={[createVirtualItem(0, 0, 50)]} />);

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should call toggleStar with correct arguments when star button is clicked", async () => {
    const toggleStar = jest.fn();

    const { user } = render(
      <ListData
        {...defaultProps}
        toggleStar={toggleStar}
        virtualItems={[createVirtualItem(0, 0, 50)]}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-star-button"));
    expect(toggleStar).toHaveBeenCalledWith("bitcoin", false);
  });

  it("should call toggleStar with isStarred=true for starred coins", async () => {
    const toggleStar = jest.fn();

    const { user } = render(
      <ListData
        {...defaultProps}
        starredMarketCoins={["bitcoin"]}
        toggleStar={toggleStar}
        virtualItems={[createVirtualItem(0, 0, 50)]}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-star-button"));
    expect(toggleStar).toHaveBeenCalledWith("bitcoin", true);
  });

  it("should set container height from virtualizer total size", () => {
    render(<ListData {...defaultProps} virtualItems={[]} totalSize={500} />);

    const container = screen.getByTestId("market-list-data");
    expect(container).toHaveStyle({ height: "500px" });
  });
});
