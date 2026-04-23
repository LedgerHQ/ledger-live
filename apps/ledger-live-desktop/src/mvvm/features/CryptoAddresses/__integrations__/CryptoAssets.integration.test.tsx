import React from "react";
import { render, screen, within } from "tests/testSetup";
import { BITCOIN_ASSET } from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import type { AssetTableItem } from "LLD/features/Assets/types";
import CryptoAssets from "../CryptoAssets";
import useCryptoAssetsViewModel from "../hooks/useCryptoAssetsViewModel";
import type { CryptoAssetsViewModel } from "../types";

jest.mock("../hooks/useCryptoAssetsViewModel");

const mockedUseCryptoAssetsViewModel = jest.mocked(useCryptoAssetsViewModel);

const realBitcoinRow: AssetTableItem = { ...BITCOIN_ASSET, isPlaceholder: false };

const baseViewModel: CryptoAssetsViewModel = {
  title: "Crypto assets",
  onBack: jest.fn(),
  items: [],
  isLoading: true,
  onAssetRowClick: jest.fn(),
  trackingType: "crypto",
};

describe("CryptoAssets (Crypto assets page)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCryptoAssetsViewModel.mockReturnValue(baseViewModel);
  });

  it("shows the page title and no asset table while loading", () => {
    mockedUseCryptoAssetsViewModel.mockReturnValue({
      ...baseViewModel,
      isLoading: true,
    });

    render(<CryptoAssets />);

    expect(screen.getByText("Crypto assets")).toBeVisible();
    const pageContent = screen.getByTestId("crypto-assets-page-content");
    expect(pageContent).toBeVisible();
    expect(within(pageContent).queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the stablecoins table with column headers when loaded", () => {
    mockedUseCryptoAssetsViewModel.mockReturnValue({
      ...baseViewModel,
      items: [realBitcoinRow],
      isLoading: false,
    });

    render(<CryptoAssets />);

    const pageContent = screen.getByTestId("crypto-assets-page-content");
    expect(within(pageContent).getByRole("columnheader", { name: "Name" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "Price" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "Balance" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "Value" })).toBeVisible();
    expect(within(pageContent).getByRole("columnheader", { name: "1D Trend" })).toBeVisible();
  });

  it("calls onAssetRowClick when a data row is activated", async () => {
    const onAssetRowClick = jest.fn();

    mockedUseCryptoAssetsViewModel.mockReturnValue({
      ...baseViewModel,
      items: [realBitcoinRow],
      isLoading: false,
      onAssetRowClick,
    });

    const { user } = render(<CryptoAssets />);

    const pageContent = screen.getByTestId("crypto-assets-page-content");
    await user.click(within(pageContent).getByRole("button", { name: /Bitcoin/ }));

    expect(onAssetRowClick).toHaveBeenCalledTimes(1);
    expect(onAssetRowClick).toHaveBeenCalledWith(realBitcoinRow);
  });
});
