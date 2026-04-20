import React from "react";
import { render, screen } from "@tests/test-renderer";
import AssetListItem from "../index";
import type { AssetListItemViewModelResult } from "../usePrecomputedAssetListData";
import { createCryptoAsset, bitcoin } from "./shared";

const mockAsset = createCryptoAsset(bitcoin, 100000);

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
  });
});
