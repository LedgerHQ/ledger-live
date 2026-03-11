import React from "react";
import { fireEvent, render, renderHook } from "@testing-library/react-native";
import {
  CommonActions,
  NavigationProp,
  NavigationState,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { SwapWebviewAllowedPageNames, WebviewAPI } from "~/components/Web3AppWebview/types";
import { useSwapHeaderNavigation } from "../useSwapHeaderNavigation";
import { useIsSwapTab } from "../useIsSwapTab";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

const mockTrack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  useTrack: () => mockTrack,
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useWalletFeaturesConfig: jest.fn(),
}));

jest.mock("../useIsSwapTab", () => ({
  useIsSwapTab: jest.fn(),
}));

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseIsSwapTab = jest.mocked(useIsSwapTab);
const mockedUseWalletFeaturesConfig = jest.mocked(useWalletFeaturesConfig);

describe("useSwapHeaderNavigation", () => {
  const setOptions = jest.fn();
  const navigate = jest.fn();
  const goBack = jest.fn();
  const dispatch = jest.fn();
  const webviewGoBack = jest.fn();
  const webviewRef: React.RefObject<WebviewAPI | null> = {
    current: {
      goBack: webviewGoBack,
      goForward: jest.fn(),
      reload: jest.fn(),
      loadURL: jest.fn(),
      notify: jest.fn(),
    },
  };
  const navigation: Omit<NavigationProp<ParamListBase>, "getState"> & {
    getState(): NavigationState | undefined;
  } = {
    addListener: jest.fn(),
    canGoBack: jest.fn(),
    dispatch,
    getId: jest.fn(),
    getParent: jest.fn(),
    goBack,
    isFocused: jest.fn(),
    navigate,
    navigateDeprecated: jest.fn(),
    preload: jest.fn(),
    removeListener: jest.fn(),
    replaceParams: jest.fn(),
    reset: jest.fn(),
    setOptions,
    setParams: jest.fn(),
    getState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockImplementation(() => navigation);
    mockedUseWalletFeaturesConfig.mockReturnValue({
      isEnabled: false,
      shouldDisplayMarketBanner: false,
      shouldDisplayGraphRework: false,
      shouldDisplayQuickActionCtas: false,
      shouldDisplayNewReceiveDialog: false,
      shouldDisplayWallet40MainNav: false,
      shouldUseLazyOnboarding: false,
      shouldDisplayBalanceRefreshRework: false,
      shouldDisplayTour: false,
      shouldDisplayAssetSection: false,
    });
  });

  function renderLegacyHook(params?: {
    canGoBack?: boolean;
    page?: SwapWebviewAllowedPageNames;
    isTransactionComplete?: boolean;
  }) {
    mockedUseIsSwapTab.mockReturnValue({
      isSwapTabScreen: true,
      swapTabScreen: {
        key: "swap-tab",
        name: ScreenName.SwapTab,
        params: params ? { swapNavigationParams: params } : {},
      },
    });

    return renderHook(() => useSwapHeaderNavigation(webviewRef));
  }

  function getLatestOptions() {
    return setOptions.mock.calls[setOptions.mock.calls.length - 1]?.[0];
  }

  it("should wire quotes list back button to webview back in legacy mode", () => {
    renderLegacyHook({
      canGoBack: true,
      page: SwapWebviewAllowedPageNames.QuotesList,
    });

    const options = getLatestOptions();
    expect(options.headerRight).toBeUndefined();

    const { getByTestId } = render(options.headerLeft());

    fireEvent.press(getByTestId("NavigationHeaderClose"));

    expect(webviewGoBack).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should navigate to legacy swap history from the default header", () => {
    renderLegacyHook();

    const options = getLatestOptions();
    const { getByTestId } = render(options.headerRight());

    fireEvent.press(getByTestId("navigation-header-swap-history"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.SwapHistory);
    expect(navigate).not.toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
      screen: ScreenName.SwapHistory,
    });
  });

  it("should reset to swap tab from completed two-step approval", () => {
    renderLegacyHook({
      canGoBack: true,
      page: SwapWebviewAllowedPageNames.TwoStepApproval,
      isTransactionComplete: true,
    });

    const options = getLatestOptions();
    expect(options.headerLeft).toBeUndefined();

    const { getByTestId } = render(options.headerRight());

    fireEvent.press(getByTestId("NavigationHeaderCloseButton"));

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
  });

  it("should keep the translated default title in legacy mode", () => {
    renderLegacyHook();

    const options = getLatestOptions();

    expect(options.headerTitle).toBe("translated:transfer.swap2.form.title");
  });
});
