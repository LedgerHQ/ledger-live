import React from "react";
import { Virtualizer } from "@tanstack/react-virtual";
import { render, screen } from "tests/testSetup";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { MarketTableView, MarketTableViewProps } from "../MarketTableView";
import { mockT } from "../../__tests__/shared";

const emptyVirtualizer = {
  getVirtualItems: () => [],
  getTotalSize: () => 0,
} as unknown as Virtualizer<HTMLDivElement, Element>;

function createProps(overrides: Partial<MarketTableViewProps> = {}): MarketTableViewProps {
  return {
    parentRef: { current: null },
    rowVirtualizer: emptyVirtualizer,
    marketData: MOCK_MARKET_CURRENCY_DATA,
    marketParams: { order: Order.MarketCapDesc },
    counterCurrency: "usd",
    range: "24h",
    search: "",
    locale: "en",
    currenciesLength: MOCK_MARKET_CURRENCY_DATA.length,
    showSkeleton: false,
    resetSearch: jest.fn(),
    isStarred: () => false,
    toggleStar: jest.fn(),
    marketCapSort: "desc",
    changeSort: undefined,
    onToggleMarketCap: jest.fn(),
    onToggleChange: jest.fn(),
    t: mockT,
    ...overrides,
  };
}

describe("MarketTableView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the favorites empty state when emptyState is 'favorites'", () => {
    render(<MarketTableView {...createProps({ emptyState: "favorites" })} />);

    expect(screen.queryByTestId("market-list-header")).toBeNull();
    expect(screen.queryByTestId("market-list-data")).toBeNull();
  });

  it("should render the no-crypto placeholder when there are no currencies and no skeleton", () => {
    render(<MarketTableView {...createProps({ currenciesLength: 0, showSkeleton: false })} />);

    expect(screen.queryByTestId("market-list-data")).toBeNull();
  });

  it("should render the skeleton when showSkeleton is true", () => {
    render(<MarketTableView {...createProps({ showSkeleton: true })} />);

    expect(screen.getByTestId("market-table-skeleton")).toBeVisible();
    expect(screen.queryByTestId("market-list-data")).toBeNull();
  });

  it("should render the header and table body when data is available", () => {
    render(<MarketTableView {...createProps()} />);

    expect(screen.getByTestId("market-list-header")).toBeVisible();
    expect(screen.getByTestId("market-list-data")).toBeVisible();
    expect(screen.queryByTestId("market-table-skeleton")).toBeNull();
  });
});
