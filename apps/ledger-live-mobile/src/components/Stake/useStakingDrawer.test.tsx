import BigNumber from "bignumber.js";
import type { NavigationProp, ParamListBase, RouteProp } from "@react-navigation/native";
import { NavigatorName } from "~/const";
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
    getRouteParamsForPlatformApp: (...args: unknown[]) =>
      mockGetRouteParamsForPlatformApp(...args),
  }),
}));

jest.mock("../../generated/accountActions", () => ({
  __esModule: true,
  default: {
    bitcoin: { getMainActions: (...args: unknown[]) => mockGetMainActions(...args) },
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
});
