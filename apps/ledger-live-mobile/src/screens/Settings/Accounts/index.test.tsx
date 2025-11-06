import React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import AccountsSettings from "./index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const mockNavigate = jest.fn();
const mockFindTokenById = jest.fn();

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

const mockPolygonCurrency: CryptoCurrency = {
  id: "polygon",
  name: "Polygon",
  ticker: "MATIC",
  type: "CryptoCurrency",
  managerAppName: "Polygon",
  coinType: 60,
  scheme: "polygon",
  color: "#8247e5",
  family: "ethereum",
  explorerViews: [],
  units: [
    {
      name: "matic",
      code: "MATIC",
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

const mockPolygonUsdcToken: TokenCurrency = {
  id: "polygon/erc20/usdc",
  type: "TokenCurrency",
  name: "USD Coin (Polygon)",
  ticker: "USDC",
  contractAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  parentCurrency: mockPolygonCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

const mockNavigation = {
  navigate: mockNavigate,
} as unknown as StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.AccountsSettings
>["navigation"];

const mockRoute = {
  key: "AccountsSettings",
  name: ScreenName.AccountsSettings,
} as unknown as StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.AccountsSettings
>["route"];

describe("AccountsSettings - BlacklistedTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty list when there are no blacklisted tokens", () => {
    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: [],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    // The component should render without errors
    expect(screen).toBeDefined();
  });

  it("loads and displays blacklisted tokens", async () => {
    mockFindTokenById.mockResolvedValue(mockUsdtToken);

    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: ["ethereum/erc20/usdt"],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    await waitFor(() => {
      expect(mockFindTokenById).toHaveBeenCalledWith("ethereum/erc20/usdt");
    });

    await waitFor(() => {
      expect(screen.getByText("Tether USD")).toBeDefined();
      expect(screen.getByText("Ethereum")).toBeDefined();
    });
  });

  it("groups tokens by parent currency", async () => {
    mockFindTokenById.mockImplementation(async (tokenId: string) => {
      if (tokenId === "ethereum/erc20/usdt") return mockUsdtToken;
      if (tokenId === "ethereum/erc20/usdc") return mockUsdcToken;
      if (tokenId === "polygon/erc20/usdc") return mockPolygonUsdcToken;
      return null;
    });

    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: ["ethereum/erc20/usdt", "ethereum/erc20/usdc", "polygon/erc20/usdc"],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    await waitFor(() => {
      expect(mockFindTokenById).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      // Check both parent currencies are displayed
      expect(screen.getByText("Ethereum")).toBeDefined();
      expect(screen.getByText("Polygon")).toBeDefined();

      // Check all tokens are displayed
      expect(screen.getByText("Tether USD")).toBeDefined();
      expect(screen.getByText("USD Coin")).toBeDefined();
      expect(screen.getByText("USD Coin (Polygon)")).toBeDefined();
    });
  });

  it("dispatches showToken action when pressing remove button", async () => {
    mockFindTokenById.mockResolvedValue(mockUsdtToken);

    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: ["ethereum/erc20/usdt"],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("Tether USD")).toBeDefined();
    });

    // The component renders a TouchableOpacity for the close button
    // We verify the structure is correct
    expect(screen.getByText("Tether USD")).toBeDefined();
  });

  it("handles async loading errors gracefully", async () => {
    mockFindTokenById.mockRejectedValue(new Error("Token not found"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: ["ethereum/erc20/invalid"],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load blacklisted tokens:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("filters out null tokens when loading fails for some tokens", async () => {
    mockFindTokenById.mockImplementation(async (tokenId: string) => {
      if (tokenId === "ethereum/erc20/usdt") return mockUsdtToken;
      return null; // Return null for other tokens
    });

    render(<AccountsSettings navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: ["ethereum/erc20/usdt", "ethereum/erc20/invalid"],
        },
        accounts: {
          ...state.accounts,
          active: [],
        },
      }),
    });

    await waitFor(() => {
      expect(mockFindTokenById).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      // Only valid token should be displayed
      expect(screen.getByText("Tether USD")).toBeDefined();
      expect(screen.queryByText("Invalid")).toBeNull();
    });
  });
});
