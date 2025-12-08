import React from "react";
import { render, screen } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import { SelectNetwork } from "../index";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { mockDomMeasurements } from "../../../../../__tests__/shared";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

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

const mockAccounts = [
  bscAccount,
  genAccount("bsc-account-2", { currency: bscCurrency }),
  baseAccount,
  ethereumAccountHigh,
  genAccount("ethereum-account-2", { currency: ethereumAccountHigh.currency }),
  genAccount("ethereum-account-3", { currency: ethereumAccountHigh.currency }),
  polygonAccountMedium,
];

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
    mockDomMeasurements();
  });

  describe("Rendering", () => {
    it("should render the network list with correct networks", () => {
      render(<SelectNetwork {...defaultProps} />);

      expect(screen.getByTestId("network-item-name-BNB Chain")).toBeInTheDocument();
      expect(screen.getByTestId("network-item-name-Base")).toBeInTheDocument();
      expect(screen.getByTestId("network-item-name-Ethereum")).toBeInTheDocument();
      expect(screen.getByTestId("network-item-name-Polygon")).toBeInTheDocument();
    });

    it("should not render when networks array is empty", () => {
      render(<SelectNetwork {...defaultProps} networks={[]} />);

      expect(screen.queryByTestId(/network-item-name/)).not.toBeInTheDocument();
    });

    it("should not render when networks is undefined", () => {
      render(<SelectNetwork {...defaultProps} networks={undefined} />);

      expect(screen.queryByTestId(/network-item-name/)).not.toBeInTheDocument();
    });

    it("should not render when selectedAssetId is not provided", () => {
      render(<SelectNetwork {...defaultProps} selectedAssetId={undefined} />);

      expect(screen.queryByTestId(/network-item-name/)).not.toBeInTheDocument();
    });

    it("should handle token currencies by using their parent currency", async () => {
      const tokenNetworks: CryptoOrTokenCurrency[] = [bscUsdcToken, baseUsdcToken];

      render(<SelectNetwork {...defaultProps} networks={tokenNetworks} />, {
        initialState: {
          accounts: [
            bscAccount,
            genAccount("bsc-account-2", { currency: bscCurrency }),
            baseAccount,
          ],
        },
      });

      const networkList = screen.getAllByTestId(/network-item-name-/);

      expect(networkList[0]).toHaveAttribute("data-testid", "network-item-name-BNB Chain");
      expect(networkList[1]).toHaveAttribute("data-testid", "network-item-name-Base");
    });

    it("should handle token currencies by using their parent currency when left element undefined", async () => {
      const tokenNetworks: CryptoOrTokenCurrency[] = [bscUsdcToken, baseUsdcToken];

      render(
        <SelectNetwork
          {...defaultProps}
          networks={tokenNetworks}
          networksConfig={{ leftElement: "undefined" }}
        />,
      );

      const networkList = screen.getAllByTestId(/network-item-name-/);

      expect(networkList[0]).toHaveAttribute("data-testid", "network-item-name-BNB Chain");
      expect(networkList[1]).toHaveAttribute("data-testid", "network-item-name-Base");
    });
  });

  describe("Network Selection", () => {
    it("should call onNetworkSelected when a network is clicked", async () => {
      const { user } = render(<SelectNetwork {...defaultProps} />);

      const bscNetworkButton = screen.getByTestId("network-item-name-BNB Chain");
      await user.click(bscNetworkButton);

      expect(mockOnNetworkSelected).toHaveBeenCalledWith(expect.objectContaining(bscCurrency));
    });
  });

  describe("Network Ordering", () => {
    it("should order networks by balance when balance element is configured", () => {
      const balanceOnlyConfig = {
        ...defaultProps,
        networksConfig: { rightElement: "balance" as const },
      };

      render(<SelectNetwork {...balanceOnlyConfig} />, {
        initialState: { accounts: mockAccounts },
      });

      const networkList = screen.getAllByTestId(/network-item-name-/);

      expect(networkList).toHaveLength(4);
      expect(networkList[0]).toHaveAttribute("data-testid", "network-item-name-Ethereum");
      expect(networkList[1]).toHaveAttribute("data-testid", "network-item-name-BNB Chain");
      expect(networkList[2]).toHaveAttribute("data-testid", "network-item-name-Base");
      expect(networkList[3]).toHaveAttribute("data-testid", "network-item-name-Polygon");
    });

    it("should order networks by account count when numberOfAccounts element is configured", () => {
      const accountCountOnlyConfig = {
        ...defaultProps,
        networksConfig: { leftElement: "numberOfAccounts" as const },
      };

      render(<SelectNetwork {...accountCountOnlyConfig} />, {
        initialState: { accounts: mockAccounts },
      });

      const networkList = screen.getAllByTestId(/network-item-name-/);

      expect(networkList[0]).toHaveAttribute("data-testid", "network-item-name-Ethereum");
      expect(networkList[1]).toHaveAttribute("data-testid", "network-item-name-BNB Chain");
    });
  });
});
