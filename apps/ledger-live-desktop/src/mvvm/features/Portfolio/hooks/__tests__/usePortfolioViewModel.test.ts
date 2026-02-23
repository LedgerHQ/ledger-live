import { renderHook } from "tests/testSetup";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { BigNumber } from "bignumber.js";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { usePortfolioViewModel } from "../usePortfolioViewModel";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");
const wallet40AndExchangeFlags = {
  ...INITIAL_STATE.overriddenFeatureFlags,
  portfolioExchangeBanner: { enabled: true },
  lwdWallet40: {
    enabled: true,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
    },
  },
};
const wallet40AndExchangeSettings = {
  ...INITIAL_STATE,
  overriddenFeatureFlags: wallet40AndExchangeFlags,
};

const addressPoisoningFlags = {
  ...INITIAL_STATE.overriddenFeatureFlags,
  addressPoisoningOperationsFilter: {
    enabled: true,
    params: { families: ["evm"] },
  },
};

function createPoisonedTokenAccount() {
  const parentAccount = genAccount("eth-poison-parent", {
    currency: ethereumCurrency,
    operationsSize: 0,
  });
  const tokenAccount = genTokenAccount(0, parentAccount, usdcToken);
  const poisonedOp = { ...tokenAccount.operations[0], value: new BigNumber(0) };
  parentAccount.subAccounts = [tokenAccount];
  return { parentAccount, tokenAccount, poisonedOp };
}

describe("usePortfolioViewModel", () => {
  it("should compute account and portfolio totals when accounts are provided", () => {
    const accounts = [
      genAccount("btc-account", { currency: bitcoinCurrency, operationsSize: 1 }),
      genAccount("eth-account-1", { currency: ethereumCurrency, operationsSize: 2 }),
      genAccount("eth-account-2", { currency: ethereumCurrency, operationsSize: 0 }),
    ];

    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        accounts,
        settings: {
          ...wallet40AndExchangeSettings,
          filterTokenOperationsZeroAmount: true,
          showClearCacheBanner: true,
        },
      },
    });

    expect(result.current.totalAccounts).toBe(3);
    expect(result.current.totalCurrencies).toBe(2);
    expect(result.current.totalOperations).toBe(3);
  });

  it("should expose wallet40 and exchange banner flags when enabled in settings", () => {
    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        settings: wallet40AndExchangeSettings,
      },
    });

    expect(result.current.hasExchangeBannerCTA).toBe(true);
    expect(result.current.shouldDisplayMarketBanner).toBe(true);
    expect(result.current.shouldDisplayGraphRework).toBe(true);
    expect(result.current.shouldDisplayQuickActionCtas).toBe(true);
    expect(result.current.isWallet40Enabled).toBe(true);
  });

  it("should expose clear cache banner visibility when enabled in settings", () => {
    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          showClearCacheBanner: true,
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
  });

  it("should filter poisoned operations when zero amount filtering is enabled", () => {
    const { parentAccount, tokenAccount, poisonedOp } = createPoisonedTokenAccount();

    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        accounts: [parentAccount],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: true,
          overriddenFeatureFlags: addressPoisoningFlags,
        },
      },
    });

    expect(result.current.filterOperations(poisonedOp, tokenAccount)).toBe(false);
  });

  it("should keep poisoned operations when zero amount filtering is disabled", () => {
    const { parentAccount, tokenAccount, poisonedOp } = createPoisonedTokenAccount();

    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        accounts: [parentAccount],
        settings: {
          ...INITIAL_STATE,
          filterTokenOperationsZeroAmount: false,
        },
      },
    });

    expect(result.current.filterOperations(poisonedOp, tokenAccount)).toBe(true);
  });
});
