import React from "react";
import { render } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
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

function renderEarnWithAction(action?: string) {
  const navigation = {
    navigate: jest.fn(),
    setParams: jest.fn(),
    canGoBack: () => false,
    getParent: () => undefined,
  };

  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Earn
      navigation={navigation as any}
      route={{ key: "k", name: ScreenName.Earn, params: { action } } as any}
    />,
  );

  return navigation;
}

describe("EarnLiveAppNavigator › Earn deeplink routing", () => {
  it("routes the `simulate` action full-screen through the Base navigator", () => {
    const navigation = renderEarnWithAction("simulate");

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Earn,
      params: {
        screen: ScreenName.Earn,
        params: {
          intent: "simulate",
        },
      },
    });
  });

  it("does not route anywhere when no action is provided", () => {
    const navigation = renderEarnWithAction(undefined);

    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
