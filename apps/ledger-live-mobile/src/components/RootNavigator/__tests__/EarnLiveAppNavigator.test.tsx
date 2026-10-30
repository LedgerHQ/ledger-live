import React from "react";
import { render } from "@tests/test-renderer";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
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
jest.mock("../../Stake/useStakingDrawer", () => ({ useStakingDrawer: () => jest.fn() }));
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
