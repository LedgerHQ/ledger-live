import React, { useMemo, useState } from "react";
import { act } from "@testing-library/react-native";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render } from "@tests/test-renderer";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { addOneAccount, updateAccount } from "~/actions/accounts";
import { Earn } from "../EarnLiveAppNavigator";

// `Earn` reads `props.route` for the deeplink action and `useRoute()` for the staking-drawer parent
// route. Stub `useRoute` so the component can be rendered standalone (without a real Stack screen).
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ key: "earn-key", name: ScreenName.Earn, params: {} }),
}));

// The Earn screen renders the live-app webview and a handful of drawers that are irrelevant to the
// deeplink routing under test — stub them out to keep the test focused and lightweight.
jest.mock("~/screens/PTX/Earn", () => ({ EarnScreen: () => null }));
jest.mock("~/screens/PTX/Earn/EarnInfoDrawer", () => ({ EarnInfoDrawer: () => null }));
jest.mock("~/screens/PTX/Earn/EarnMenuDrawer", () => ({ EarnMenuDrawer: () => null }));
jest.mock("~/screens/PTX/Earn/EarnMenuBottomSheet", () => ({ EarnMenuBottomSheet: () => null }));
jest.mock("~/screens/PTX/Earn/EarnProtocolInfoDrawer", () => ({
  EarnProtocolInfoDrawer: () => null,
}));
jest.mock("~/screens/PTX/Earn/EarnInfoBottomSheet", () => ({ EarnInfoBottomSheet: () => null }));
jest.mock("~/screens/PTX/Earn/ActionConfirmationDialog", () => ({
  ActionConfirmationDialog: () => null,
}));
const mockOpenStakingDrawer = jest.fn();
jest.mock("../../Stake/useStakingDrawer", () => ({
  useStakingDrawer: () => mockOpenStakingDrawer,
}));
// Wallet API account ids are mapped to Ledger Wallet ids through a runtime table; use them as-is here.
jest.mock("@ledgerhq/live-common/wallet-api/converters", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/converters"),
  getAccountIdFromWalletAccountId: (walletAccountId: string) => walletAccountId,
}));
jest.mock("LLM/features/Stake", () => ({
  useOpenStakeDrawer: () => ({ handleOpenStakeDrawer: jest.fn() }),
}));

function renderEarnWithAction(action?: string, params: Record<string, string | undefined> = {}) {
  const baseNavigation = { navigate: jest.fn() };
  const navigation = {
    navigate: jest.fn(),
    setParams: jest.fn(),
    canGoBack: () => false,
    getParent: jest.fn((id?: string) => (id === BASE_NAVIGATOR_ID ? baseNavigation : undefined)),
  };

  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Earn
      navigation={navigation as any}
      route={{ key: "k", name: ScreenName.Earn, params: { action, ...params } } as any}
    />,
  );

  return { navigation, baseNavigation };
}

describe("EarnLiveAppNavigator › Earn deeplink routing", () => {
  it("pushes the `simulate` action full-screen on the Base navigator", () => {
    const { navigation, baseNavigation } = renderEarnWithAction("simulate");

    expect(baseNavigation.navigate).toHaveBeenCalledWith(NavigatorName.Earn, {
      screen: ScreenName.Earn,
      params: {
        intent: "simulate",
      },
    });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it("forwards the deposit protocol to the Earn webview route on the Base navigator", () => {
    const { navigation, baseNavigation } = renderEarnWithAction("deposit", {
      cryptoAssetId: "ethereum/erc20/usd__coin",
      accountId: "usdc-account",
      protocolId: "mtbill",
    });

    expect(baseNavigation.navigate).toHaveBeenCalledWith(NavigatorName.Earn, {
      screen: ScreenName.Earn,
      params: {
        intent: "deposit",
        cryptoAssetId: "ethereum/erc20/usd__coin",
        accountId: "usdc-account",
        protocolId: "mtbill",
      },
    });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it("does not route anywhere when no action is provided", () => {
    const { navigation, baseNavigation } = renderEarnWithAction(undefined);

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(baseNavigation.navigate).not.toHaveBeenCalled();
  });
});

// Keeps the route params in state so `setParams` re-renders the screen like a real navigator does.
function EarnWithLiveParams({ initialParams }: { initialParams: Record<string, string> }) {
  const [params, setParams] = useState<Record<string, string | undefined>>(initialParams);
  const navigation = useMemo(
    () => ({
      navigate: jest.fn(),
      canGoBack: () => false,
      getParent: () => undefined,
      setParams: (next: Record<string, string | undefined>) =>
        setParams(previous => ({ ...previous, ...next })),
    }),
    [],
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Earn
      navigation={navigation as any}
      route={{ key: "k", name: ScreenName.Earn, params } as any}
    />
  );
}

describe("EarnLiveAppNavigator › stake-account deeplink", () => {
  beforeEach(() => {
    mockOpenStakingDrawer.mockClear();
  });

  it("opens the staking flow once, even when the account is updated afterwards", () => {
    const account = genAccount("earn-stake-account");

    const { store } = render(
      <EarnWithLiveParams initialParams={{ action: "stake-account", accountId: account.id }} />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: { ...state.accounts, active: [account] },
        }),
      },
    );

    expect(mockOpenStakingDrawer).toHaveBeenCalledTimes(1);

    // A successful stake adds a pending operation, which updates the account in the store.
    act(() => {
      store.dispatch(updateAccount({ id: account.id, pendingOperations: [] }));
    });

    expect(mockOpenStakingDrawer).toHaveBeenCalledTimes(1);
  });

  it("waits for the account to load, then opens the staking flow once", () => {
    const account = genAccount("earn-stake-account-late");

    const { store } = render(
      <EarnWithLiveParams initialParams={{ action: "stake-account", accountId: account.id }} />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: { ...state.accounts, active: [] },
        }),
      },
    );

    expect(mockOpenStakingDrawer).not.toHaveBeenCalled();

    act(() => {
      store.dispatch(addOneAccount(account));
    });
    expect(mockOpenStakingDrawer).toHaveBeenCalledTimes(1);

    act(() => {
      store.dispatch(updateAccount({ id: account.id, pendingOperations: [] }));
    });
    expect(mockOpenStakingDrawer).toHaveBeenCalledTimes(1);
  });
});
