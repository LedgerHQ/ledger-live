/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import { SelectNetwork } from "../index";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { mockDomMeasurements } from "../../../../../__tests__/shared";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

jest.mock("../../../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: () => ({
    trackModularDrawerEvent: jest.fn(),
  }),
}));

jest.mock("@ledgerhq/react-ui/pre-ldls", () => ({
  NetworkList: ({
    networks,
    onClick,
  }: {
    networks: Array<{ id: string; name: string; ticker: string }>;
    onClick: (id: string) => void;
  }) => (
    <div data-testid="network-list">
      {networks.map(network => (
        <button
          key={network.id}
          data-testid={`network-${network.id}`}
          onClick={() => onClick(network.id)}
        >
          {network.name} - {network.ticker}
        </button>
      ))}
    </div>
  ),
}));

const bscCurrency = getCryptoCurrencyById("bsc");
const bscAccount = genAccount("bsc-account", { currency: bscCurrency });
bscAccount.balance = new BigNumber("100000000000000000000");
bscAccount.spendableBalance = bscAccount.balance;

const bscUsdcToken: TokenCurrency = {
  type: "TokenCurrency",
  parentCurrency: bscCurrency,
  tokenType: "bep20",
  id: "bsc/erc20/usdc",
  contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "Binance-Peg USD Coin",
      code: "USDC",
      magnitude: 18,
    },
  ],
};
const bscUsdcTokenAccount = genTokenAccount(0, bscAccount, bscUsdcToken);
bscAccount.subAccounts = [bscUsdcTokenAccount];

const baseCurrency = getCryptoCurrencyById("base");
const baseAccount = genAccount("base-account", { currency: baseCurrency });
baseAccount.balance = new BigNumber("1000000000000000000");
baseAccount.spendableBalance = baseAccount.balance;
const baseUsdcToken: TokenCurrency = {
  type: "TokenCurrency",
  parentCurrency: baseCurrency,
  tokenType: "erc20",
  id: "base/erc20/usd_coin",
  contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
};
const baseUsdcTokenAccount = genTokenAccount(0, baseAccount, baseUsdcToken);
baseAccount.subAccounts = [baseUsdcTokenAccount];

const ethereumCurrency = getCryptoCurrencyById("ethereum");
const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});
ethereumAccountHigh.balance = new BigNumber("1000000000000000000000");
ethereumAccountHigh.spendableBalance = ethereumAccountHigh.balance;

const ethereumAccountLow = genAccount("ethereum-account-low", {
  currency: ethereumCurrency,
});
ethereumAccountLow.balance = new BigNumber("100000000000000000");
ethereumAccountLow.spendableBalance = ethereumAccountLow.balance;

const ethereumAccountZero = genAccount("ethereum-account-zero", {
  currency: ethereumCurrency,
});
ethereumAccountZero.balance = new BigNumber("0");
ethereumAccountZero.spendableBalance = ethereumAccountZero.balance;

const polygonCurrency = getCryptoCurrencyById("polygon");
const polygonAccountMedium = genAccount("polygon-account-medium", {
  currency: polygonCurrency,
});
polygonAccountMedium.balance = new BigNumber("500000000000000000000");
polygonAccountMedium.spendableBalance = polygonAccountMedium.balance;

const mockUseAccountData = jest.fn(() => [
  {
    asset: ethereumCurrency,
    label: "3 accounts",
    count: 3,
  },
  {
    asset: polygonCurrency,
    label: "1 account",
    count: 1,
  },
  {
    asset: bscCurrency,
    label: "2 accounts",
    count: 2,
  },
  {
    asset: baseCurrency,
    label: "1 account",
    count: 1,
  },
]);

const mockUseBalanceDeps = jest.fn(() => {
  const mockCounterValuesState: CounterValuesState = {
    cache: {
      "USD ethereum": {
        fallback: 2500 / Math.pow(10, 18),
        map: new Map([["latest", 2500 / Math.pow(10, 18)]]),
        stats: {
          oldest: "2024-09-12",
          earliest: "2025-10-02T13",
          oldestDate: new Date(),
          earliestDate: new Date(),
          earliestStableDate: new Date(),
        },
      },
      "USD polygon": {
        fallback: 0.5 / Math.pow(10, 18),
        map: new Map([["latest", 0.5 / Math.pow(10, 18)]]),
        stats: {
          oldest: "2024-09-12",
          earliest: "2025-10-02T13",
          oldestDate: new Date(),
          earliestDate: new Date(),
          earliestStableDate: new Date(),
        },
      },
      "USD bsc": {
        fallback: 300 / Math.pow(10, 18),
        map: new Map([["latest", 300 / Math.pow(10, 18)]]),
        stats: {
          oldest: "2024-09-12",
          earliest: "2025-10-02T13",
          oldestDate: new Date(),
          earliestDate: new Date(),
          earliestStableDate: new Date(),
        },
      },
      "USD base": {
        fallback: 2500 / Math.pow(10, 18),
        map: new Map([["latest", 2500 / Math.pow(10, 18)]]),
        stats: {
          oldest: "2024-09-12",
          earliest: "2025-10-02T13",
          oldestDate: new Date(),
          earliestDate: new Date(),
          earliestStableDate: new Date(),
        },
      },
    },
    data: {},
    status: {},
  };

  const mockFiatCurrency: FiatCurrency = {
    type: "FiatCurrency",
    ticker: "USD",
    name: "US Dollar",
    symbol: "$",
    units: [
      {
        code: "$",
        name: "US Dollar",
        magnitude: 2,
        showAllDigits: true,
        prefixCode: true,
      },
    ],
  };

  return {
    counterValueCurrency: mockFiatCurrency,
    flattenedAccounts: [bscAccount, baseAccount, ethereumAccountHigh, polygonAccountMedium],
    state: mockCounterValuesState,
    locale: "en-US",
  };
});

jest.mock("../../../../hooks/useAccountData", () => ({
  useAccountData: () => mockUseAccountData(),
}));

jest.mock("../../../../hooks/useBalanceDeps", () => ({
  useBalanceDeps: () => mockUseBalanceDeps(),
}));

jest.mock("../../../../components/AccountCount", () => ({
  accountsCount: (props: { label: string }) => (
    <span data-testid="accounts-count">{props.label}</span>
  ),
}));

jest.mock("../../../../components/AccountCountApy", () => ({
  accountsCountAndApy: (props: { label: string }) => (
    <span data-testid="accounts-count-apy">{props.label}</span>
  ),
}));

jest.mock("../../../../components/Balance", () => ({
  balanceItem: (props: { balance?: BigNumber }) => (
    <span data-testid="balance-item">Balance: {props.balance?.toString() || "0"}</span>
  ),
}));

const mockOnNetworkSelected = jest.fn();
const mockNetworksConfig: EnhancedModularDrawerConfiguration["networks"] = {
  leftElement: "numberOfAccounts",
  rightElement: "balance",
};

const defaultProps = {
  networks: [bscCurrency, baseCurrency, ethereumCurrency, polygonCurrency],
  onNetworkSelected: mockOnNetworkSelected,
  networksConfig: mockNetworksConfig,
  selectedAssetId: "test-asset",
};

describe("SelectNetwork Integration Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDomMeasurements();
  });

  describe("Rendering", () => {
    it("should render the network list with correct networks", () => {
      render(<SelectNetwork {...defaultProps} />);

      expect(screen.getByTestId("network-list")).toBeInTheDocument();

      expect(screen.getByTestId("network-bsc")).toBeInTheDocument();
      expect(screen.getByTestId("network-base")).toBeInTheDocument();
      expect(screen.getByTestId("network-ethereum")).toBeInTheDocument();
      expect(screen.getByTestId("network-polygon")).toBeInTheDocument();
    });

    it("should not render when networks array is empty", () => {
      render(<SelectNetwork {...defaultProps} networks={[]} />);

      expect(screen.queryByTestId("network-list")).not.toBeInTheDocument();
    });

    it("should not render when networks is undefined", () => {
      render(<SelectNetwork {...defaultProps} networks={undefined} />);

      expect(screen.queryByTestId("network-list")).not.toBeInTheDocument();
    });

    it("should not render when selectedAssetId is not provided", () => {
      render(<SelectNetwork {...defaultProps} selectedAssetId={undefined} />);

      expect(screen.queryByTestId("network-list")).not.toBeInTheDocument();
    });

    it("should handle token currencies by using their parent currency", async () => {
      const tokenNetworks: CryptoOrTokenCurrency[] = [bscUsdcToken, baseUsdcToken];

      const tokenTestBalanceDeps = {
        ...mockUseBalanceDeps(),
        flattenedAccounts: [bscAccount, baseAccount],
      };

      mockUseBalanceDeps.mockReturnValueOnce(tokenTestBalanceDeps);
      mockUseAccountData.mockReturnValueOnce([
        {
          asset: bscCurrency,
          label: "2 accounts",
          count: 2,
        },
        {
          asset: baseCurrency,
          label: "1 account",
          count: 1,
        },
      ]);

      render(<SelectNetwork {...defaultProps} networks={tokenNetworks} />);

      expect(screen.getByTestId("network-list")).toBeInTheDocument();

      const networkList = screen.getByTestId("network-list");
      const networkButtons = networkList.querySelectorAll("button");

      expect(networkButtons[0]).toHaveAttribute("data-testid", "network-bsc");
      expect(networkButtons[1]).toHaveAttribute("data-testid", "network-base");
    });

    it("should handle token currencies by using their parent currency when left element undefined", async () => {
      const tokenNetworks: CryptoOrTokenCurrency[] = [bscUsdcToken, baseUsdcToken];

      const tokenTestBalanceDeps = {
        ...mockUseBalanceDeps(),
        flattenedAccounts: [bscAccount, baseAccount],
      };

      mockUseBalanceDeps.mockReturnValueOnce(tokenTestBalanceDeps);

      render(
        <SelectNetwork
          {...defaultProps}
          networks={tokenNetworks}
          networksConfig={{ leftElement: "undefined" }}
        />,
      );

      expect(screen.getByTestId("network-list")).toBeInTheDocument();

      const networkList = screen.getByTestId("network-list");
      const networkButtons = networkList.querySelectorAll("button");

      expect(networkButtons[0]).toHaveAttribute("data-testid", "network-bsc");
      expect(networkButtons[1]).toHaveAttribute("data-testid", "network-base");
    });
  });

  describe("Network Selection", () => {
    it("should call onNetworkSelected when a network is clicked", async () => {
      render(<SelectNetwork {...defaultProps} />);

      const bscNetworkButton = screen.getByTestId("network-bsc");
      fireEvent.click(bscNetworkButton);

      await waitFor(() => {
        expect(mockOnNetworkSelected).toHaveBeenCalledWith(bscCurrency);
      });
    });
  });

  describe("Network Ordering", () => {
    it("should order networks by balance when balance element is configured", () => {
      const balanceOnlyConfig = {
        ...defaultProps,
        networksConfig: { rightElement: "balance" as const },
      };

      render(<SelectNetwork {...balanceOnlyConfig} />);

      const networkList = screen.getByTestId("network-list");
      const networkButtons = networkList.querySelectorAll("button");

      expect(networkButtons).toHaveLength(4);
      expect(networkButtons[0]).toHaveAttribute("data-testid", "network-ethereum");
      expect(networkButtons[1]).toHaveAttribute("data-testid", "network-bsc");
      expect(networkButtons[2]).toHaveAttribute("data-testid", "network-polygon");
      expect(networkButtons[3]).toHaveAttribute("data-testid", "network-base");
    });

    it("should order networks by account count when numberOfAccounts element is configured", () => {
      const accountCountOnlyConfig = {
        ...defaultProps,
        networksConfig: { leftElement: "numberOfAccounts" as const },
      };

      render(<SelectNetwork {...accountCountOnlyConfig} />);

      const networkList = screen.getByTestId("network-list");
      const networkButtons = networkList.querySelectorAll("button");

      expect(networkButtons[0]).toHaveAttribute("data-testid", "network-ethereum");
      expect(networkButtons[1]).toHaveAttribute("data-testid", "network-bsc");
    });
  });
});
