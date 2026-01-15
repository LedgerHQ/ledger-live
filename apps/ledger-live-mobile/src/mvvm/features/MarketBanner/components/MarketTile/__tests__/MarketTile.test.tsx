import React from "react";
import { render, fireEvent } from "@tests/test-renderer";
import {
  MOCK_MARKET_PERFORMERS,
  createMockMarketPerformer,
} from "@ledgerhq/live-common/market/utils/fixtures";
import MarketTile from "../index";

// Get specific performers from fixtures
const bitcoin = MOCK_MARKET_PERFORMERS[0]; // Bitcoin
const ethereum = MOCK_MARKET_PERFORMERS[1]; // Ethereum
const polkadot = MOCK_MARKET_PERFORMERS[4]; // Polkadot (has negative 24h change)

describe("MarketTile", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders tile with correct name", () => {
      const { getByText } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      expect(getByText("Bitcoin")).toBeTruthy();
    });

    it("renders tile with testID based on index", () => {
      const { getByTestId } = render(
        <MarketTile item={ethereum} index={5} range="day" onPress={mockOnPress} />,
      );

      expect(getByTestId("market-banner-tile-5")).toBeTruthy();
    });
  });

  describe("Price change display", () => {
    it("displays positive price change with + sign", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityLabel).toContain("+5.50%");
    });

    it("displays negative price change without + sign", () => {
      const { getByTestId } = render(
        <MarketTile item={polkadot} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityLabel).toContain("-1.50%");
      expect(tile.props.accessibilityLabel).not.toContain("+-");
    });

    it("displays zero price change with + sign", () => {
      const itemWithZero = createMockMarketPerformer({ priceChangePercentage24h: 0 });
      const { getByTestId } = render(
        <MarketTile item={itemWithZero} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityLabel).toContain("+0.00%");
    });
  });

  describe("Portfolio range handling", () => {
    it("uses 24h change for 'day' range", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      // Bitcoin has priceChangePercentage24h: 5.5
      expect(tile.props.accessibilityLabel).toContain("5.50%");
    });

    it("uses 7d change for 'week' range", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="week" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      // Bitcoin has priceChangePercentage7d: 12.3
      expect(tile.props.accessibilityLabel).toContain("12.30%");
    });

    it("uses 30d change for 'month' range", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="month" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      // Bitcoin has priceChangePercentage30d: 25.47
      expect(tile.props.accessibilityLabel).toContain("25.47%");
    });

    it("uses 1y change for 'year' range", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="year" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      // Bitcoin has priceChangePercentage1y: 150.82
      expect(tile.props.accessibilityLabel).toContain("150.82%");
    });
  });

  describe("User interaction", () => {
    it("calls onPress with item when tile is pressed", async () => {
      const { getByTestId, user } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      await user.press(getByTestId("market-banner-tile-0"));

      expect(mockOnPress).toHaveBeenCalledTimes(1);
      expect(mockOnPress).toHaveBeenCalledWith(bitcoin);
    });
  });

  describe("Icon rendering", () => {
    it("renders image icon when imageUrl is provided", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      expect(getByTestId("market-tile-icon-image")).toBeTruthy();
    });

    it("renders fallback letter when no image is provided", () => {
      const itemWithoutImage = createMockMarketPerformer({ image: "", name: "Ethereum" });
      const { getByTestId, getByText } = render(
        <MarketTile item={itemWithoutImage} index={0} range="day" onPress={mockOnPress} />,
      );

      expect(getByTestId("market-tile-icon-fallback")).toBeTruthy();
      expect(getByText("E")).toBeTruthy();
    });

    it("renders fallback letter when image fails to load", () => {
      const itemWithInvalidImage = createMockMarketPerformer({
        image: "https://invalid-url.com/image.png",
        name: "Cardano",
      });
      const { getByTestId, getByText, queryByTestId } = render(
        <MarketTile item={itemWithInvalidImage} index={0} range="day" onPress={mockOnPress} />,
      );

      // Initially the image should be rendered
      const image = getByTestId("market-tile-icon-image");
      expect(image).toBeTruthy();
      expect(queryByTestId("market-tile-icon-fallback")).toBeNull();

      // Simulate image error
      fireEvent(image, "error");

      // After error, fallback should be visible
      expect(getByTestId("market-tile-icon-fallback")).toBeTruthy();
      expect(getByText("C")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has correct accessibility label for positive change", () => {
      const { getByTestId } = render(
        <MarketTile item={bitcoin} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityLabel).toContain("Bitcoin");
      expect(tile.props.accessibilityLabel).toContain("+5.50%");
    });

    it("has correct accessibility label for negative change", () => {
      const { getByTestId } = render(
        <MarketTile item={polkadot} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityLabel).toContain("Polkadot");
      expect(tile.props.accessibilityLabel).toContain("-1.50%");
    });

    it("has button accessibility role", () => {
      const { getByTestId } = render(
        <MarketTile item={ethereum} index={0} range="day" onPress={mockOnPress} />,
      );

      const tile = getByTestId("market-banner-tile-0");
      expect(tile.props.accessibilityRole).toBe("button");
    });
  });
});
