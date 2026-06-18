import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import AssetListItem from "../index";
import type { AssetListItemViewModelResult } from "../usePrecomputedAssetListData";
import type { MarketAssetDisplayData } from "../types";
import { createCryptoAsset, bitcoin } from "./shared";

const mockAsset = createCryptoAsset(bitcoin, 100000);

const mockMarket: MarketAssetDisplayData = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "btc",
  ledgerIds: ["bitcoin"],
  formattedMarketCap: "$1.7 T",
  marketcapRank: 1,
  formattedPrice: "$92,258.93",
  priceChangePercentage: 7.87,
};

const renderMarketView = (overrides: Partial<MarketAssetDisplayData> = {}, onPress = jest.fn()) =>
  render(
    <AssetListItem variant="market" market={{ ...mockMarket, ...overrides }} onPress={onPress} />,
  );

const baseViewModelResult: AssetListItemViewModelResult = {
  formattedBalance: "0.001 BTC",
  formattedCounterValue: "$45.00",
  countervalueChange: { percentage: 0.035, value: 1.5 },
};

const renderView = (vmOverrides: Partial<AssetListItemViewModelResult> = {}) =>
  render(
    <AssetListItem
      asset={mockAsset}
      onPress={jest.fn()}
      precomputed={{ ...baseViewModelResult, ...vmOverrides }}
    />,
  );

describe("AssetListItem", () => {
  describe("leading content", () => {
    beforeEach(() => {
      renderView();
    });

    it("should render the currency name", () => {
      expect(screen.getByText("Bitcoin")).toBeVisible();
    });

    it("should render the formatted native balance", () => {
      expect(screen.getByText("0.001 BTC")).toBeVisible();
    });
  });

  describe("trailing content", () => {
    it("should render the counter value when available", () => {
      renderView();
      expect(screen.getByText("$45.00")).toBeVisible();
    });

    it("should not render the counter value when null", () => {
      renderView({ formattedCounterValue: null });
      expect(screen.queryByText("$45.00")).toBeNull();
    });

    it("should render the delta for a positive change", () => {
      renderView({ countervalueChange: { percentage: 0.035, value: 1.5 } });
      expect(screen.getByText(/3\.50%/)).toBeVisible();
    });

    it("should render the delta for a negative change", () => {
      renderView({ countervalueChange: { percentage: -0.012, value: -0.5 } });
      expect(screen.getByText(/1\.20%/)).toBeVisible();
    });

    it("should not render the delta when countervalueChange is null", () => {
      renderView({ countervalueChange: null });
      expect(screen.queryByText(/%/)).toBeNull();
    });

    it("renders the 1D price fallback through the delta when it is supplied as the change", () => {
      renderView({ countervalueChange: { percentage: 0.012, value: 12 } });
      expect(screen.getByText(/1\.20%/)).toBeVisible();
    });
  });

  describe("market variant", () => {
    it("renders the name, market cap, rank tag and price", () => {
      renderMarketView();
      expect(screen.getByText("Bitcoin")).toBeVisible();
      expect(screen.getByText("$1.7 T")).toBeVisible();
      expect(screen.getByText("#1")).toBeVisible();
      expect(screen.getByText("$92,258.93")).toBeVisible();
    });

    it("renders the price change trend", () => {
      renderMarketView();
      expect(screen.getByText(/7\.87%/)).toBeVisible();
    });

    it("hides the rank tag when rank is unknown", () => {
      renderMarketView({ marketcapRank: 0 });
      expect(screen.queryByText("#0")).toBeNull();
    });

    it("calls onPress with the market data when tapped", () => {
      const onPress = jest.fn();
      renderMarketView({}, onPress);
      fireEvent.press(screen.getByTestId("marketItem-bitcoin"));
      expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ id: "bitcoin" }));
    });
  });
});
