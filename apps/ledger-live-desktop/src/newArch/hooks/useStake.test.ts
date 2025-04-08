import { useStake } from "LLD/hooks/useStake";
import BigNumber from "bignumber.js";
import { renderHookWithLiveAppProvider } from "tests/testUtils";

import { accountRawToAccountUserData, WalletState } from "@ledgerhq/live-wallet/store";

import { AccountRaw, TokenAccount } from "@ledgerhq/types-live";

import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const raw: AccountRaw = {
  id: "js:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  name: "A",
  derivationMode: "",
  index: 0,
  freshAddress: "0x01",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 8168983,
  operations: [],
  pendingOperations: [],
  currencyId: "ethereum",
  lastSyncDate: "2019-07-17T15:13:30.318Z",
  balance: "1000000000000000000",
};
const rawTron: AccountRaw = {
  id: "js:2:tron:T:",
  seedIdentifier: "T",
  name: "Tron",
  derivationMode: "",
  index: 1,
  freshAddress: "T123",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 8168983,
  operations: [],
  pendingOperations: [],
  currencyId: "tron",
  lastSyncDate: "2025-07-17T15:13:30.318Z",
  balance: "100000000000000",
};

const mockEthereumAccount = fromAccountRaw(raw);
const mockTronAccount = fromAccountRaw(rawTron);

const mockUSDTTokenAccount: TokenAccount = {
  type: "TokenAccount",
  id: "js:2:ethereum:0x01:usdt:",
  parentId: "js:2:ethereum:0x01:",
  token: {
    type: "TokenCurrency",
    id: "ethereum/erc20/usd_tether__erc20_",
    contractAddress: "",
    parentCurrency: {
      id: "ethereum",
      type: "CryptoCurrency",
    } as CryptoCurrency,
    tokenType: "",
    name: "",
    ticker: "",
    units: [],
  },
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: new Date(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    WEEK: { latestDate: null, balances: [] },
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};
const mockUSDCTokenAccount: TokenAccount = {
  ...mockUSDTTokenAccount,
  id: "js:2:ethereum:0x01:usdc:",
  token: {
    type: "TokenCurrency",
    id: "ethereum/erc20/usd__coin",
    contractAddress: "",
    parentCurrency: {
      id: "ethereum",
      type: "CryptoCurrency",
    } as CryptoCurrency,
    tokenType: "",
    name: "",
    ticker: "",
    units: [],
  },
  spendableBalance: new BigNumber(123456),
  balance: new BigNumber(123456),
};

const walletState: WalletState = {
  accountNames: new Map(),
  starredAccountIds: new Set(),
  walletSyncState: {
    data: null,
    version: 0,
  },
  nonImportedAccountInfos: [],
};

const userData = accountRawToAccountUserData(raw);
const userDataTron = accountRawToAccountUserData(rawTron);

walletState.accountNames.set(userData.id, userData.name);
walletState.accountNames.set(userDataTron.id, userDataTron.name);

const feature_stake_programs_json = {
  enabled: true,
  params: {
    list: [
      "mantra",
      "xion",
      "ethereum",
      "solana",
      "tezos",
      "cosmos",
      "osmo",
      "celo",
      "near",
      "elrond",
      "quicksilver",
      "persistence",
      "onomy",
      "axelar",
      "cardano",
      "dydx",
      "injective",
    ],
    redirects: {
      "ethereum/erc20/usd__coin": {
        platform: "mock-dapp-v1",
        name: "Dapp",
        queryParams: {
          chainId: 1,
        },
      },
      "ethereum/erc20/usd_tether__erc20_": {
        platform: "mock-dapp-v3",
        name: "Dapp v3",
        queryParams: {
          chainId: 1,
        },
      },
      tron: {
        platform: "mock-live-app",
        name: "Live App",
        queryParams: {
          yieldId: "tron-native-staking",
        },
      },
    },
  },
};

describe("useStake()", () => {
  it("should return the correct currency ids for staking for natively enabled currencies and for partner supported tokens", async () => {
    const { result } = renderHookWithLiveAppProvider(() => useStake(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(result.current.enabledCurrencies).toEqual([
      "mantra",
      "xion",
      "ethereum",
      "solana",
      "tezos",
      "cosmos",
      "osmo",
      "celo",
      "near",
      "elrond",
      "quicksilver",
      "persistence",
      "onomy",
      "axelar",
      "cardano",
      "dydx",
      "injective",
    ]);

    expect(result.current.partnerSupportedAssets).toEqual([
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/usd_tether__erc20_",
      "tron",
    ]);
  });

  it("should NOT return a route path for an ETH account that has a native flow.", async () => {
    const { result } = renderHookWithLiveAppProvider(() => useStake(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(result.current.getRouteToPlatformApp(mockEthereumAccount, walletState)).toEqual(null);
    expect(result.current.getCanStakeUsingLedgerLive(mockEthereumAccount.currency.id)).toEqual(
      true,
    );
    expect(result.current.getCanStakeUsingPlatformApp(mockEthereumAccount.currency.id)).toEqual(
      false,
    );
  });

  it("should NOT return a route path for a USDT token account with no funds, but SHOULD return v3 dapp route for the same account WITH funds", async () => {
    const { result } = renderHookWithLiveAppProvider(() => useStake(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(result.current.getCanStakeUsingLedgerLive(mockUSDTTokenAccount.token.id)).toEqual(false);
    expect(result.current.getCanStakeUsingPlatformApp(mockUSDTTokenAccount.token.id)).toEqual(true);

    expect(
      result.current.getRouteToPlatformApp(mockUSDTTokenAccount, walletState, mockEthereumAccount),
    ).toEqual(null);

    const mockUSDTAccountWithBalance = {
      ...mockUSDTTokenAccount,
      spendableBalance: new BigNumber(100),
      balance: new BigNumber(100),
    };

    const URIEncodedParentAccountId = encodeURIComponent(mockEthereumAccount.id);

    expect(
      result.current.getRouteToPlatformApp(
        mockUSDTAccountWithBalance,
        walletState,
        mockEthereumAccount,
      ),
    ).toEqual(
      expect.objectContaining({
        pathname: "/platform/mock-dapp-v3",
        state: {
          appId: "mock-dapp-v3",
          accountId: "js:2:ethereum:0x01:",
          customDappUrl: `https://mockdapp.com/?embed=true&chainId=1&accountId=${URIEncodedParentAccountId}`,
          name: "Mock Dapp v3",
          walletAccountId: "1a536838-dd18-5e39-b13f-0ba422fb395c",
          returnTo: "/account/js:2:ethereum:0x01:/js:2:ethereum:0x01:usdt:",
          chainId: 1,
        },
      }),
    );
  });

  it("should return the correct dapp browser v1 navigation params for a given token account", async () => {
    const { result } = renderHookWithLiveAppProvider(() => useStake(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(
      result.current.getRouteToPlatformApp(mockUSDCTokenAccount, walletState, mockEthereumAccount),
    ).toEqual(
      expect.objectContaining({
        pathname: "/platform/mock-dapp-v1",
        state: {
          accountId: "6760dd02-ab43-5c5a-9c7e-c75731580a08",
          customDappUrl:
            "https://mockapp.com/?something=isHere&chainId=1&accountId=6760dd02-ab43-5c5a-9c7e-c75731580a08",
          name: "Mock dapp browser v1 app",
          appId: "mock-dapp-v1",
          walletAccountId: "6760dd02-ab43-5c5a-9c7e-c75731580a08",
          returnTo: "/account/js:2:ethereum:0x01:/js:2:ethereum:0x01:usdc:",
          chainId: 1,
        },
      }),
    );
  });

  it("should get the correct live app staking route params for a given Tron account", async () => {
    const { result } = renderHookWithLiveAppProvider(() => useStake(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(result.current.getCanStakeUsingLedgerLive(mockTronAccount.currency.id)).toEqual(false);
    expect(result.current.getCanStakeUsingPlatformApp(mockTronAccount.currency.id)).toEqual(true);

    expect(result.current.getRouteToPlatformApp(mockTronAccount, walletState)).toEqual({
      pathname: "/platform/mock-live-app",
      state: {
        accountId: "0eda416c-9669-57a2-84f6-741df8c11267",
        customDappUrl:
          "https://mock-live-app.com/?manifestParam=mockInitialParam&yieldId=tron-native-staking&accountId=0eda416c-9669-57a2-84f6-741df8c11267",
        name: "Mock Live App",
        appId: "mock-live-app",
        walletAccountId: "0eda416c-9669-57a2-84f6-741df8c11267",
        returnTo: "/account/js:2:tron:T:",
        yieldId: "tron-native-staking",
      },
    });
  });
});
