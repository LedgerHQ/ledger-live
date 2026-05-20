import { renderHook, act } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, DistributionItem } from "@ledgerhq/types-live";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import { useBalanceDetailsViewModel } from "../useBalanceDetailsViewModel";

const mockOpenDrawer = jest.fn();

jest.mock("LLM/features/QuickActions/hooks/useTransferDrawerController", () => ({
  useTransferDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

const mockGetCanStakeCurrency = jest.fn().mockReturnValue(false);

jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({ getCanStakeCurrency: mockGetCanStakeCurrency }),
}));

const mockHandleOpenStakeDrawer = jest.fn();
const mockUseOpenStakeDrawer = jest.fn((_props: unknown) => ({
  handleOpenStakeDrawer: mockHandleOpenStakeDrawer,
}));

jest.mock("LLM/features/Stake", () => ({
  useOpenStakeDrawer: (props: unknown) => mockUseOpenStakeDrawer(props),
}));

const mockUseInterestRatesByCurrencies = jest.fn().mockReturnValue({});

jest.mock("@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies", () => ({
  useInterestRatesByCurrencies: (currencies: unknown) =>
    mockUseInterestRatesByCurrencies(currencies),
}));

function buildDistributionItem(
  currency: DistributionItem["currency"],
  accounts: AccountLike[],
  countervalue = 0,
): DistributionItem {
  return {
    currency,
    distribution: 1,
    accounts,
    amount: accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0),
    countervalue,
  };
}

describe("useBalanceDetailsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCanStakeCurrency.mockReturnValue(false);
    mockUseInterestRatesByCurrencies.mockReturnValue({});
  });

  it("returns defaults when currency is undefined", () => {
    const { result } = renderHook(() => useBalanceDetailsViewModel(undefined, undefined));

    expect(result.current.hasAccounts).toBe(false);
    expect(result.current.formattedTotalBalance).toBe("");
    expect(result.current.earnState.type).toBe("hidden");
  });

  it("returns no accounts when distributionItem is missing", () => {
    const { result } = renderHook(() =>
      useBalanceDetailsViewModel(mockBtcCryptoCurrency, undefined),
    );

    expect(result.current.hasAccounts).toBe(false);
  });

  it("uses the distribution item amount as the displayed total balance", () => {
    const btcAccount = genAccount("bitcoin-0", {
      currency: mockBtcCryptoCurrency,
      operationsSize: 0,
    });
    btcAccount.balance = new BigNumber(1_000_000_000);
    btcAccount.spendableBalance = new BigNumber(1_000_000_000);

    const { result } = renderHook(() =>
      useBalanceDetailsViewModel(
        mockBtcCryptoCurrency,
        buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
      ),
    );

    expect(result.current.hasAccounts).toBe(true);
    expect(result.current.formattedTotalBalance.length).toBeGreaterThan(0);
  });

  it("sums balances across sibling networks via the aggregated distributionItem", () => {
    const algorandCurrency = getCryptoCurrencyById("algorand");
    const usdtEthToken: TokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd_tether__erc20_",
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      parentCurrency: mockEthCryptoCurrency,
      tokenType: "erc20",
      name: "Tether USD",
      ticker: "USDT",
      units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
    };
    const usdtAlgoToken: TokenCurrency = {
      type: "TokenCurrency",
      id: "algorand/asa/312769",
      contractAddress: "312769",
      parentCurrency: algorandCurrency,
      tokenType: "asa",
      name: "Tether USDt",
      ticker: "USDT",
      units: [{ name: "Tether USDt", code: "USDT", magnitude: 6 }],
    };

    const ethAccount = genAccount("usdt-eth", {
      currency: mockEthCryptoCurrency,
      operationsSize: 0,
    });
    const ethSub = genTokenAccount(0, ethAccount, usdtEthToken);
    ethSub.balance = new BigNumber(120_000_000);
    ethSub.spendableBalance = ethSub.balance;

    const algoAccount = genAccount("usdt-algo", {
      currency: algorandCurrency,
      operationsSize: 0,
    });
    const algoSub = genTokenAccount(0, algoAccount, usdtAlgoToken);
    algoSub.balance = new BigNumber(80_000_000);
    algoSub.spendableBalance = algoSub.balance;

    const item: DistributionItem = {
      currency: usdtEthToken,
      distribution: 1,
      accounts: [ethSub, algoSub],
      amount: 200_000_000,
      countervalue: 200,
    };

    const { result } = renderHook(() => useBalanceDetailsViewModel(usdtEthToken, item));

    expect(result.current.hasAccounts).toBe(true);
    expect(result.current.formattedTotalBalance).toContain("200");
    expect(result.current.counterValue).toBe(200);
  });

  it("returns a valid counterValueFormatter", () => {
    const btcAccount = genAccount("bitcoin-0", {
      currency: mockBtcCryptoCurrency,
      operationsSize: 0,
    });

    const { result } = renderHook(() =>
      useBalanceDetailsViewModel(
        mockBtcCryptoCurrency,
        buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
      ),
    );

    const formatted = result.current.counterValueFormatter(1234.56);
    expect(formatted.integerPart).toBeDefined();
    expect(formatted.currencyText).toBeDefined();
    expect(formatted.decimalSeparator).toBeDefined();
  });

  describe("earnState", () => {
    it("is hidden when not stakeable", () => {
      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("hidden");
    });

    it("shows banner when stakeable but no stake", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);

      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("banner");
    });

    it("formats the banner APY by converting the decimal fraction to a percentage", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockUseInterestRatesByCurrencies.mockReturnValue({
        bitcoin: { value: 0.0345, type: "APY" },
      });

      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("banner");
      if (result.current.earnState.type === "banner") {
        expect(result.current.earnState.label).toContain("3.45");
      }
    });

    it("falls back to the generic banner when the rounded percentage is 0%", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockUseInterestRatesByCurrencies.mockReturnValue({
        bitcoin: { value: 0.00001, type: "APY" },
      });

      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("banner");
      if (result.current.earnState.type === "banner") {
        expect(result.current.earnState.label).toBe("Earn with this asset");
        expect(result.current.earnState.label).not.toContain("Earn up to");
      }
    });

    it("falls back to the generic banner when no interest rate is available", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockUseInterestRatesByCurrencies.mockReturnValue({});

      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("banner");
      if (result.current.earnState.type === "banner") {
        expect(result.current.earnState.label).toBe("Earn with this asset");
        expect(result.current.earnState.label).not.toContain("Earn up to");
      }
    });

    it("shows staked state when balance > spendableBalance", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);

      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });
      btcAccount.balance = new BigNumber(1_000_000_000);
      btcAccount.spendableBalance = new BigNumber(800_000_000);

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(result.current.earnState.type).toBe("staked");
      if (result.current.earnState.type === "staked") {
        expect(result.current.earnState.formattedAvailable).toBeDefined();
        expect(result.current.earnState.formattedDeposit).toBeDefined();
      }
    });
  });

  describe("callbacks", () => {
    it("onTransferPress opens drawer and fires analytics", () => {
      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      act(() => result.current.onTransferPress());

      expect(mockOpenDrawer).toHaveBeenCalledWith({ sourceScreenName: "Asset Detail" });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "transfer",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("onEarnBannerPress and onEarnDepositPress fire analytics and open the stake drawer", () => {
      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      act(() => result.current.onEarnBannerPress());
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "earn_banner",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenStakeDrawer).toHaveBeenCalledTimes(1);

      act(() => result.current.onEarnDepositPress());
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "earn_deposit",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenStakeDrawer).toHaveBeenCalledTimes(2);
    });

    it("configures useOpenStakeDrawer with the current currency and Asset Detail source", () => {
      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      renderHook(() =>
        useBalanceDetailsViewModel(
          mockBtcCryptoCurrency,
          buildDistributionItem(mockBtcCryptoCurrency, [btcAccount]),
        ),
      );

      expect(mockUseOpenStakeDrawer).toHaveBeenCalledWith({
        sourceScreenName: "Asset Detail",
        currencies: [mockBtcCryptoCurrency.id],
      });
    });

    it("calls useOpenStakeDrawer with undefined currencies when no currency is provided", () => {
      renderHook(() => useBalanceDetailsViewModel(undefined, undefined));

      expect(mockUseOpenStakeDrawer).toHaveBeenCalledWith({
        sourceScreenName: "Asset Detail",
        currencies: undefined,
      });
    });
  });
});
