import { renderHook, act } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import { useBalanceDetailsViewModel } from "../useBalanceDetailsViewModel";

const mockOpenDrawer = jest.fn();

jest.mock("LLM/features/QuickActions/hooks/useTransferDrawerController", () => ({
  useTransferDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

const mockGetCanStakeCurrency = jest.fn().mockReturnValue(false);

jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({ getCanStakeCurrency: mockGetCanStakeCurrency }),
}));

function withAccounts(currencyId: string, count: number, opts?: { withStake?: boolean }) {
  const currency = currencyId === "bitcoin" ? mockBtcCryptoCurrency : mockEthCryptoCurrency;
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: Array.from({ length: count }, (_, i) => {
          const acc = genAccount(`${currencyId}-${i}`, { currency, operationsSize: 0 });
          if (opts?.withStake) {
            acc.balance = new BigNumber(1_000_000_000);
            acc.spendableBalance = new BigNumber(800_000_000);
          }
          return acc;
        }),
      },
    }),
  };
}

describe("useBalanceDetailsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCanStakeCurrency.mockReturnValue(false);
  });

  it("returns defaults when currency is undefined", () => {
    const { result } = renderHook(() => useBalanceDetailsViewModel(undefined));

    expect(result.current.hasAccounts).toBe(false);
    expect(result.current.formattedTotalBalance).toBe("");
    expect(result.current.earnState.type).toBe("hidden");
  });

  it("detects accounts only for the matching currency", () => {
    const { result: mismatch } = renderHook(
      () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
      withAccounts("ethereum", 2),
    );
    expect(mismatch.current.hasAccounts).toBe(false);

    const { result: match } = renderHook(
      () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
      withAccounts("bitcoin", 2),
    );
    expect(match.current.hasAccounts).toBe(true);
    expect(match.current.formattedTotalBalance.length).toBeGreaterThan(0);
  });

  it("returns a valid counterValueFormatter", () => {
    const { result } = renderHook(
      () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
      withAccounts("bitcoin", 1),
    );

    const formatted = result.current.counterValueFormatter(1234.56);
    expect(formatted.integerPart).toBeDefined();
    expect(formatted.currencyText).toBeDefined();
    expect(formatted.decimalSeparator).toBeDefined();
  });

  describe("earnState", () => {
    it("is hidden when not stakeable", () => {
      const { result } = renderHook(
        () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1),
      );

      expect(result.current.earnState.type).toBe("hidden");
    });

    it("shows banner when stakeable but no stake", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);

      const { result } = renderHook(
        () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1),
      );

      expect(result.current.earnState.type).toBe("banner");
    });

    it("shows staked state when balance > spendableBalance", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);

      const { result } = renderHook(
        () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1, { withStake: true }),
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
      const { result } = renderHook(
        () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1),
      );

      act(() => result.current.onTransferPress());

      expect(mockOpenDrawer).toHaveBeenCalledWith({ sourceScreenName: "Asset Detail" });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "transfer",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("onEarnBannerPress and onEarnDepositPress fire analytics", () => {
      const { result } = renderHook(
        () => useBalanceDetailsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1),
      );

      act(() => result.current.onEarnBannerPress());
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "earn_banner",
        currency: "bitcoin",
        page: "Asset Detail",
      });

      act(() => result.current.onEarnDepositPress());
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "earn_deposit",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });
  });
});
