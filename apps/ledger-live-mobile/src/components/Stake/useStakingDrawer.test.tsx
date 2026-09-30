import BigNumber from "bignumber.js";
import type { NavigationProp, ParamListBase, RouteProp } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useStakingDrawer } from "./useStakingDrawer";
import {
  customRenderHookWithLiveAppProvider as renderHook,
  withFlagOverrides,
} from "@tests/test-renderer";

const mockGetMainActions = jest.fn();
const mockBridge = { isAccountEmpty: jest.fn().mockReturnValue(false) };
const mockGetRouteParamsForPlatformApp = jest.fn().mockReturnValue(null);

jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({
    getRouteParamsForPlatformApp: (...args: unknown[]) => mockGetRouteParamsForPlatformApp(...args),
  }),
}));

jest.mock("../../generated/accountActions", () => ({
  __esModule: true,
  default: {
    bitcoin: { getMainActions: (...args: unknown[]) => mockGetMainActions(...args) },
    tezos: { getMainActions: (...args: unknown[]) => mockGetMainActions(...args) },
    internet_computer: { getMainActions: (...args: unknown[]) => mockGetMainActions(...args) },
    evm: jest.requireActual("~/families/evm/accountActions").default,
  },
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => Promise.resolve(mockBridge)),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/helpers"),
  getAccountSpendableBalance: jest.fn().mockReturnValue(new BigNumber(1_000_000)),
}));

const bitcoinAccount = {
  type: "Account" as const,
  id: "btc-1",
  currency: { family: "bitcoin", id: "bitcoin" },
};

const seiEvmAccount = {
  type: "Account" as const,
  id: "sei-1",
  currency: { family: "evm", id: "sei_evm", ticker: "SEI" },
  spendableBalance: new BigNumber(1_000_000),
  stakingResources: { delegations: [] },
};

const navigation = { navigate: jest.fn() } as unknown as NavigationProp<ParamListBase>;
const parentRoute = {
  key: "parent",
  name: "Parent",
} as unknown as RouteProp<ParamListBase>;

describe("useStakingDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRouteParamsForPlatformApp.mockReturnValue(null);
  });

  it("passes resolved bridge to family getMainActions", async () => {
    mockGetMainActions.mockReturnValue([
      { id: "stake", navigationParams: ["Stake", { screen: "StakeScreen", params: {} }] },
    ]);

    const { result } = renderHook(() =>
      useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
    );

    await result.current(bitcoinAccount as never);

    expect(mockGetMainActions).toHaveBeenCalledTimes(1);
    expect(mockGetMainActions).toHaveBeenCalledWith(
      expect.objectContaining({ bridge: mockBridge, account: bitcoinAccount }),
    );
  });

  it("navigates to the family stake flow returned by getMainActions", async () => {
    mockGetMainActions.mockReturnValue([
      {
        id: "stake",
        navigationParams: ["StakeNavigator", { screen: "StakeStep", params: { foo: 1 } }],
      },
    ]);

    const { result } = renderHook(() =>
      useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
    );

    await result.current(bitcoinAccount as never);

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: "StakeNavigator",
      drawer: undefined,
      params: {
        screen: "StakeStep",
        params: { foo: 1, account: bitcoinAccount, parentAccount: undefined },
      },
    });
  });

  it("forwards currencyId as cryptoAssetId when swapToEarn flag is enabled", async () => {
    const earnNavParams = {
      screen: NavigatorName.Earn,
      params: { screen: "Earn", platform: "earn", params: { cryptoAssetId: "ethereum" } },
    };
    mockGetRouteParamsForPlatformApp.mockReturnValue(earnNavParams);

    const { result } = renderHook(
      () => useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
      { overrideInitialState: withFlagOverrides({ swapToEarn: { enabled: true } }) },
    );

    await result.current(bitcoinAccount as never, undefined, "ethereum");

    expect(mockGetRouteParamsForPlatformApp).toHaveBeenCalledWith(
      bitcoinAccount,
      expect.any(Object), // walletState from Redux store
      undefined, // parentAccount
      "ethereum", // cryptoAssetId forwarded because swapToEarn is enabled
    );
    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, earnNavParams);
  });

  it("does not forward currencyId when swapToEarn flag is disabled", async () => {
    mockGetMainActions.mockReturnValue([
      { id: "stake", navigationParams: ["Stake", { screen: "StakeScreen", params: {} }] },
    ]);

    const { result } = renderHook(
      () => useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
      { overrideInitialState: withFlagOverrides({ swapToEarn: { enabled: false } }) },
    );

    await result.current(bitcoinAccount as never, undefined, "ethereum");

    expect(mockGetRouteParamsForPlatformApp).toHaveBeenCalledWith(
      bitcoinAccount,
      expect.any(Object), // walletState from Redux store
      undefined,
      undefined, // cryptoAssetId is suppressed when swapToEarn is disabled
    );
  });

  it.each([
    { family: "tezos", currencyId: "tezos", flag: "llmTezosStaking" },
    { family: "internet_computer", currencyId: "internet_computer", flag: "llmIcpStaking" },
  ] as const)(
    "passes the $flag feature to $family getMainActions",
    async ({ family, currencyId, flag }) => {
      mockGetMainActions.mockReturnValue([]);
      const account = {
        type: "Account" as const,
        id: `${family}-1`,
        currency: { family, id: currencyId },
      };

      const { result } = renderHook(
        () => useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
        { overrideInitialState: withFlagOverrides({ [flag]: { enabled: true } }) },
      );

      await result.current(account as never);

      expect(mockGetMainActions).toHaveBeenCalledWith(
        expect.objectContaining({ account, [flag]: expect.objectContaining({ enabled: true }) }),
      );
    },
  );

  it("navigates SEI EVM accounts to the validator selection when evmNativeStaking is enabled", async () => {
    const { result } = renderHook(
      () => useStakingDrawer({ navigation, parentRoute, alwaysShowNoFunds: false }),
      {
        overrideInitialState: withFlagOverrides({
          evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["sei_evm"] } },
        }),
      },
    );

    await result.current(seiEvmAccount as never);

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.EvmDelegationFlow,
      drawer: undefined,
      params: {
        screen: ScreenName.EvmDelegationValidator,
        params: { source: parentRoute, account: seiEvmAccount, parentAccount: undefined },
      },
    });
  });
});
