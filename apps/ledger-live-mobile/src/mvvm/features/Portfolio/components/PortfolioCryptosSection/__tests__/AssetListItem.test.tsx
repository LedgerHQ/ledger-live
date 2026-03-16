import React from "react";
import { render, screen } from "@tests/test-renderer";
import AssetListItem from "../AssetListItem";
import {
  useAssetListItemViewModel,
  type AssetListItemViewModelResult,
} from "../useAssetListItemViewModel";
import { createCryptoAsset, bitcoin } from "./shared";

jest.mock("../useAssetListItemViewModel", () => ({
  useAssetListItemViewModel: jest.fn(),
}));

const mockedViewModel = jest.mocked(useAssetListItemViewModel);

const mockAsset = createCryptoAsset(bitcoin, 100000);

const baseViewModelResult: AssetListItemViewModelResult = {
  formattedBalance: "0.001 BTC",
  formattedCounterValue: "$45.00",
  deltaText: "+3.50%",
  deltaColor: "success",
};

const renderView = (vmOverrides: Partial<AssetListItemViewModelResult> = {}) => {
  mockedViewModel.mockReturnValue({ ...baseViewModelResult, ...vmOverrides });
  return render(<AssetListItem asset={mockAsset} onPress={jest.fn()} />);
};

describe("AssetListItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it.each([
      { deltaText: "+3.50%", deltaColor: "success" as const, label: "positive" },
      { deltaText: "-1.20%", deltaColor: "error" as const, label: "negative" },
      { deltaText: "–", deltaColor: "muted" as const, label: "unavailable" },
    ])("should render the delta with $label variation", ({ deltaText, deltaColor }) => {
      renderView({ deltaText, deltaColor });
      expect(screen.getByText(deltaText)).toBeVisible();
    });
  });
});
