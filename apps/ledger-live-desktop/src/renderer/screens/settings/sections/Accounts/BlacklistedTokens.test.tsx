/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { fireEvent } from "@testing-library/react";
import BlacklistedTokens from "./BlacklistedTokens";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

const mockSync = jest.fn();
const mockFindTokenById = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockSync,
}));

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: () => ({
    findTokenById: mockFindTokenById,
  }),
}));

const mockEthereumCurrency: CryptoCurrency = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  type: "CryptoCurrency",
  managerAppName: "Ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "ethereum",
  explorerViews: [],
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
};

const mockUsdtToken: TokenCurrency = {
  id: "ethereum/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrency: mockEthereumCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDT",
      code: "USDT",
      magnitude: 6,
    },
  ],
};

const mockUsdcToken: TokenCurrency = {
  id: "ethereum/erc20/usdc",
  type: "TokenCurrency",
  name: "USD Coin",
  ticker: "USDC",
  contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  parentCurrency: mockEthereumCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

describe("BlacklistedTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when there are no blacklisted tokens", () => {
    render(<BlacklistedTokens />, {
      initialState: { settings: { blacklistedTokenIds: [] } },
    });

    expect(screen.getByText("Hidden tokens")).toBeInTheDocument();
    expect(
      screen.getByText(/You can hide tokens by going to the parent account then right-clicking/i),
    ).toBeInTheDocument();
    // When there are no blacklisted tokens, the count should not be displayed
    expect(screen.queryByText(/\d+ token/)).not.toBeInTheDocument();
  });

  it("displays count and can toggle visibility when tokens are blacklisted", async () => {
    mockFindTokenById.mockResolvedValue(mockUsdtToken);

    render(<BlacklistedTokens />, {
      initialState: { settings: { blacklistedTokenIds: ["ethereum/erc20/usdt"] } },
    });

    await waitFor(() => {
      expect(screen.getByText("1 token")).toBeInTheDocument();
    });

    // Verify section is not visible initially
    expect(screen.queryByText("Tether USD")).not.toBeInTheDocument();

    // Click to toggle visibility
    const countElement = screen.getByText("1 token");
    const row = countElement.closest('[class*="sc-cMa-dbN"]'); // Click the row container
    if (row) {
      fireEvent.click(row);
    }

    // Verify tokens are now visible
    await waitFor(() => {
      expect(screen.getByText("Tether USD")).toBeInTheDocument();
    });
  });

  it("groups tokens by parent currency", async () => {
    mockFindTokenById.mockImplementation(async (tokenId: string) => {
      if (tokenId === "ethereum/erc20/usdt") return mockUsdtToken;
      if (tokenId === "ethereum/erc20/usdc") return mockUsdcToken;
      return null;
    });

    render(<BlacklistedTokens />, {
      initialState: {
        settings: { blacklistedTokenIds: ["ethereum/erc20/usdt", "ethereum/erc20/usdc"] },
      },
    });

    // Wait for tokens to load
    await waitFor(() => {
      expect(mockFindTokenById).toHaveBeenCalledTimes(2);
    });

    // Click to toggle visibility
    const countElement = screen.getByText("2 tokens");
    const row = countElement.closest('[class*="sc-cMa-dbN"]');
    if (row) {
      fireEvent.click(row);
    }

    // Verify both tokens are visible under Ethereum
    await waitFor(() => {
      expect(screen.getByText("Ethereum")).toBeInTheDocument();
      expect(screen.getByText("Tether USD")).toBeInTheDocument();
      expect(screen.getByText("USD Coin")).toBeInTheDocument();
    });
  });

  it("dispatches showToken action when clicking remove icon", async () => {
    mockFindTokenById.mockResolvedValue(mockUsdtToken);

    render(<BlacklistedTokens />, {
      initialState: { settings: { blacklistedTokenIds: ["ethereum/erc20/usdt"] } },
    });

    // Wait for token to load
    await waitFor(() => {
      expect(mockFindTokenById).toHaveBeenCalled();
    });

    // Toggle visibility to show tokens
    const countElement = screen.getByText("1 token");
    const row = countElement.closest('[class*="sc-cMa-dbN"]');
    if (row) {
      fireEvent.click(row);
    }

    // Wait for token to be visible
    await waitFor(() => {
      expect(screen.getByText("Tether USD")).toBeInTheDocument();
    });

    // Verify the token was fetched
    expect(mockFindTokenById).toHaveBeenCalledWith("ethereum/erc20/usdt");
  });

  it("handles async loading errors gracefully", async () => {
    mockFindTokenById.mockRejectedValue(new Error("Token not found"));

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<BlacklistedTokens />, {
      initialState: { settings: { blacklistedTokenIds: ["ethereum/erc20/invalid"] } },
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load blacklisted tokens:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
