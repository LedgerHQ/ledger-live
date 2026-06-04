import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { createMarketAssetDisplayData } from "LLM/features/Market/__tests__/helpers";
import { MARKET_SCREEN_TEST_IDS } from "../../../testIds";
import { MarketAssetsList } from "..";

const asset = createMarketAssetDisplayData();

const defaultProps = {
  assets: [asset],
  loading: false,
  loadingMore: false,
  error: false,
  onAssetPress: jest.fn(),
  onEndReached: jest.fn(),
  showSubheader: true,
  header: <Box testID="market-assets-list-header" />,
};

describe("MarketAssetsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the header, subheader, and asset rows when ready", () => {
    render(<MarketAssetsList {...defaultProps} />);

    expect(screen.getByTestId("market-assets-list-header")).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeVisible();
    expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
  });

  it("should hide the header and subheader during search", () => {
    render(
      <MarketAssetsList {...defaultProps} assets={[]} header={undefined} showSubheader={false} />,
    );

    expect(screen.queryByTestId("market-assets-list-header")).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeNull();
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

  it("should render the error banner and loading-more footer", () => {
    render(<MarketAssetsList {...defaultProps} assets={[]} error loadingMore />);

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsError)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFooterSpinner)).toBeVisible();
  });
});
