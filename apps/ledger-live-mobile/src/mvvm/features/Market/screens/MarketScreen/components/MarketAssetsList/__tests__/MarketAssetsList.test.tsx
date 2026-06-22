import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { createMarketAssetDisplayData } from "LLM/features/Market/__tests__/helpers";
import { MARKET_SCREEN_TEST_IDS } from "../../../testIds";
import type { MarketCategoryTab } from "../../../useMarketCategories";
import type { MarketFilters } from "../../../useMarketFilters";
import { MarketAssetsList } from "..";

const asset = createMarketAssetDisplayData();

const categoryTabs: MarketCategoryTab[] = [
  { value: "all", labelKey: "market.assets.categories.all" },
  { value: "starred", labelKey: "market.assets.categories.favorites" },
  { value: "stocks", labelKey: "market.assets.categories.stocks" },
];

const filters: MarketFilters = {
  isOpen: false,
  sorting: "marketCap",
  timeframe: "1D",
  sortingOptions: [],
  timeframeOptions: [],
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onSelectSorting: jest.fn(),
  onSelectTimeframe: jest.fn(),
};

const defaultProps = {
  assets: [asset],
  loading: false,
  error: false,
  emptyState: undefined,
  selectedCategory: "all",
  categoryTabs,
  onSelectCategory: jest.fn(),
  filters,
  onAssetPress: jest.fn(),
  onEndReached: jest.fn(),
  showSubheader: true,
  header: <Box testID="market-assets-list-header" />,
} satisfies React.ComponentProps<typeof MarketAssetsList>;

describe("MarketAssetsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the header, subheader, and asset rows when ready", () => {
    render(<MarketAssetsList {...defaultProps} />);

    expect(screen.getByTestId("market-assets-list-header")).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFilterButton)).toBeVisible();
    expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
  });

  it("should hide the header and subheader during search", () => {
    render(
      <MarketAssetsList {...defaultProps} assets={[]} header={undefined} showSubheader={false} />,
    );

    expect(screen.queryByTestId("market-assets-list-header")).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsFilterButton)).toBeNull();
  });

  it("should render three skeleton rows while loading", () => {
    render(<MarketAssetsList {...defaultProps} assets={[]} loading />);

    expect(screen.getAllByTestId(MARKET_SCREEN_TEST_IDS.assetsSkeleton)).toHaveLength(3);
  });

  it("should render the search empty state when search returns no assets", () => {
    render(
      <MarketAssetsList {...defaultProps} assets={[]} header={undefined} showSubheader={false} />,
    );

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsEmptySearch)).toBeVisible();
    expect(screen.getByText("No assets found")).toBeVisible();
  });

  it("should render the favorites empty state", () => {
    render(<MarketAssetsList {...defaultProps} assets={[]} emptyState="favorites" />);

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFavoritesEmptyIcon)).toBeVisible();
    expect(screen.getByText("No favorites yet")).toBeVisible();
  });

  it("should render the stocks empty state", () => {
    render(<MarketAssetsList {...defaultProps} assets={[]} emptyState="stocks" />);

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsStocksEmpty)).toBeVisible();
    expect(screen.getByText("No stocks found")).toBeVisible();
  });

  it("should render the error banner", () => {
    render(<MarketAssetsList {...defaultProps} assets={[]} error />);

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsError)).toBeVisible();
  });
});
