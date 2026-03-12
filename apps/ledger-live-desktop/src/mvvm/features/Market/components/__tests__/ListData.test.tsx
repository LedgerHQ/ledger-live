import React from "react";
import { render, screen } from "tests/testSetup";
import type { Virtualizer } from "@tanstack/react-virtual";
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

function createMockVirtualizer(
  virtualItems: Array<ReturnType<typeof createVirtualItem>>,
  totalSize = 1000,
) {
  const getVirtualItemsFn = Object.assign(() => virtualItems, {
    updateDeps: (_newDeps: [number[], unknown[]]) => {},
  });
  // @ts-expect-error partial mock for testing
  const mock: Virtualizer<HTMLDivElement, Element> = {
    getTotalSize: () => totalSize,
    getVirtualItems: getVirtualItemsFn,
  };
  return mock;
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all currencies from virtualizer items", () => {
    const rowVirtualizer = createMockVirtualizer([
      createVirtualItem(0, 0, 50),
      createVirtualItem(1, 50, 50),
    ]);

    render(<ListData {...defaultProps} rowVirtualizer={rowVirtualizer} />);

    expect(screen.getByTestId("market-BTC-row")).toBeVisible();
    expect(screen.getByTestId("market-ETH-row")).toBeVisible();
  });

  it("should render currency name and ticker", () => {
    const rowVirtualizer = createMockVirtualizer([createVirtualItem(0, 0, 50)]);

    render(<ListData {...defaultProps} rowVirtualizer={rowVirtualizer} />);

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });

  it("should skip rendering when currency is undefined", () => {
    const rowVirtualizer = createMockVirtualizer([
      createVirtualItem(0, 0, 50),
      createVirtualItem(5, 50, 50),
    ]);

    render(<ListData {...defaultProps} rowVirtualizer={rowVirtualizer} />);

    expect(screen.getByTestId("market-BTC-row")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("should render star button for starred currency", () => {
    const rowVirtualizer = createMockVirtualizer([createVirtualItem(0, 0, 50)]);

    render(
      <ListData
        {...defaultProps}
        starredMarketCoins={["bitcoin"]}
        rowVirtualizer={rowVirtualizer}
      />,
    );

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should render star button for non-starred currency", () => {
    const rowVirtualizer = createMockVirtualizer([createVirtualItem(0, 0, 50)]);

    render(<ListData {...defaultProps} rowVirtualizer={rowVirtualizer} />);

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should call toggleStar with correct arguments when star button is clicked", async () => {
    const toggleStar = jest.fn();
    const rowVirtualizer = createMockVirtualizer([createVirtualItem(0, 0, 50)]);

    const { user } = render(
      <ListData {...defaultProps} toggleStar={toggleStar} rowVirtualizer={rowVirtualizer} />,
    );

    await user.click(screen.getByTestId("market-BTC-star-button"));
    expect(toggleStar).toHaveBeenCalledWith("bitcoin", false);
  });

  it("should call toggleStar with isStarred=true for starred coins", async () => {
    const toggleStar = jest.fn();
    const rowVirtualizer = createMockVirtualizer([createVirtualItem(0, 0, 50)]);

    const { user } = render(
      <ListData
        {...defaultProps}
        starredMarketCoins={["bitcoin"]}
        toggleStar={toggleStar}
        rowVirtualizer={rowVirtualizer}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-star-button"));
    expect(toggleStar).toHaveBeenCalledWith("bitcoin", true);
  });

  it("should set container height from virtualizer total size", () => {
    const rowVirtualizer = createMockVirtualizer([], 500);

    render(<ListData {...defaultProps} rowVirtualizer={rowVirtualizer} />);

    const container = screen.getByTestId("market-list-data");
    expect(container).toHaveStyle({ height: "500px" });
  });
});
