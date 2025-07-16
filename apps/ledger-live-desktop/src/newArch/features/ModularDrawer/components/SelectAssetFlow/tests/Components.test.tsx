import React from "react";
import { render, screen } from "tests/testSetup";
import {
  AssetSelectionStep,
  NetworkSelectionStep,
  type AssetSelectionStepProps,
  type NetworkSelectionStepProps,
} from "../components";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { MockedList } from "./Shared";

jest.mock("@ledgerhq/react-ui/pre-ldls", () => {
  const actual = jest.requireActual("@ledgerhq/react-ui/pre-ldls");
  return {
    ...actual,
    get AssetList() {
      return MockedList;
    },
    get NetworkList() {
      return MockedList;
    },
  };
});

describe("SelectAssetFlow Components", () => {
  describe("AssetSelectionStep", () => {
    it("should render AssetSelectionStep component correctly", () => {
      const props: AssetSelectionStepProps = {
        assetTypes: [],
        assetsToDisplay: [],
        sortedCryptoCurrencies: [],
        setAssetsToDisplay: jest.fn(),
        onAssetSelected: jest.fn(),
      };

      render(<AssetSelectionStep {...props} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("should call onAssetSelected when an asset is clicked", async () => {
      const onAssetSelected = jest.fn();
      const props: AssetSelectionStepProps = {
        assetTypes: [
          { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
          { id: "ethereum", name: "Ethereum", ticker: "ETH" },
        ],
        assetsToDisplay: [
          { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoCurrency,
          { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoCurrency,
        ],
        sortedCryptoCurrencies: [
          { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoCurrency,
          { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoCurrency,
        ],
        setAssetsToDisplay: jest.fn(),
        onAssetSelected,
      };

      const { user } = render(<AssetSelectionStep {...props} />);

      const bitcoinItem = screen.getByText(/bitcoin/i);
      await user.click(bitcoinItem);

      expect(onAssetSelected).toHaveBeenCalledWith({
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
      });
    });
  });

  describe("NetworkSelectionStep", () => {
    it("should render NetworkSelectionStep component correctly", () => {
      const props: NetworkSelectionStepProps = {
        networks: [
          { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoCurrency,
          { id: "ethereum", name: "Ethereum" } as CryptoCurrency,
        ],
        onNetworkSelected: jest.fn(),
      };

      render(<NetworkSelectionStep {...props} />);

      const bitcoinItem = screen.getByText(/bitcoin/i);
      expect(bitcoinItem).toBeInTheDocument();
    });

    it("should call onNetworkSelected when a network is clicked", async () => {
      const onNetworkSelected = jest.fn();
      const props: NetworkSelectionStepProps = {
        networks: [
          { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoCurrency,
          { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoCurrency,
        ],
        onNetworkSelected,
      };

      const { user } = render(<NetworkSelectionStep {...props} />);

      const bitcoinItem = screen.getByText(/bitcoin/i);
      await user.click(bitcoinItem);

      expect(onNetworkSelected).toHaveBeenCalledWith({
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
      });
    });
  });
});
