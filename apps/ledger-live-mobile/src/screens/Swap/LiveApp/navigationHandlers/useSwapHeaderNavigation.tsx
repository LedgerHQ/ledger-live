import React, { useCallback, useEffect } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { useTrack } from "~/analytics";
import { SWAP_VERSION } from "~/screens/Swap/utils";
import { useTranslation } from "~/context/Locale";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { SwapLiveAppNavigationParams } from "~/screens/Swap/types";
import Touchable from "~/components/Touchable";
import { SwapWebviewAllowedPageNames, WebviewAPI } from "~/components/Web3AppWebview/types";
import { useIsSwapTab } from "./useIsSwapTab";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

function getScreenTitle({
  webviewCurrentPage,
  isTransactionComplete,
  t,
}: {
  webviewCurrentPage?: SwapWebviewAllowedPageNames;
  isTransactionComplete?: boolean;
  t: (key: string) => string;
}) {
  switch (webviewCurrentPage) {
    case SwapWebviewAllowedPageNames.TwoStepApproval:
      return isTransactionComplete
        ? t("transfer.swap2.twoStepApproval.completedTitle")
        : t("transfer.swap2.twoStepApproval.title");
    case SwapWebviewAllowedPageNames.QuotesList:
      return t("transfer.swap2.quotesList.title");
    default:
      return t("transfer.swap2.form.title");
  }
}

function hasSwapNavigationParams(params: unknown): params is SwapLiveAppNavigationParams {
  return typeof params === "object" && params !== null && "swapNavigationParams" in params;
}

export function useSwapHeaderNavigation(webviewRef: React.RefObject<WebviewAPI | null>) {
  const navigation = useNavigation<
    StackNavigatorNavigation<BaseNavigatorStackParamList> &
      StackNavigatorNavigation<SwapNavigatorParamList>
  >();
  const { t } = useTranslation();
  const track = useTrack();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  const { isSwapTabScreen, swapTabScreen } = useIsSwapTab();

  const navigateToSwapHistory = useCallback(() => {
    track("button_clicked", {
      button: "SwapHistory",
      page: ScreenName.SwapTab,
      swapVersion: SWAP_VERSION,
    });

    if (shouldDisplayWallet40MainNav) {
      navigation.navigate(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapHistory,
      });
      return;
    }

    navigation.navigate(ScreenName.SwapHistory);
  }, [navigation, shouldDisplayWallet40MainNav, track]);

  const goBackWebView = useCallback(
    (currentWebviewPage?: SwapWebviewAllowedPageNames) => {
      track("button_clicked", {
        button: "SwapWebviewBack",
        page: ScreenName.SwapTab,
        webviewPage: currentWebviewPage,
        swapVersion: SWAP_VERSION,
      });

      webviewRef.current?.goBack();
    },
    [webviewRef, track],
  );

  const goBackNative = useCallback(() => {
    track("button_clicked", {
      button: "SwapNativeBack",
      page: ScreenName.SwapTab,
      swapVersion: SWAP_VERSION,
    });

    navigation.goBack();
  }, [navigation, track]);

  const navigateToSwapForm = useCallback(() => {
    track("button_clicked", {
      button: "SwapCloseTwoStep",
      page: ScreenName.SwapTab,
      swapVersion: SWAP_VERSION,
    });

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
  }, [track, navigation]);

  useEffect(() => {
    if (!isSwapTabScreen) return;

    const swapNavigationParams = hasSwapNavigationParams(swapTabScreen?.params)
      ? swapTabScreen.params.swapNavigationParams
      : undefined;

    const webviewCanGoBack = swapNavigationParams?.canGoBack;
    const webviewCurrentPage = swapNavigationParams?.page;
    const isTransactionComplete = swapNavigationParams?.isTransactionComplete;

    const isTwoStepApproval = webviewCurrentPage === SwapWebviewAllowedPageNames.TwoStepApproval;

    // When transaction is complete on two-step-approval, show close button on the right
    if (isTwoStepApproval && isTransactionComplete) {
      navigation.setOptions({
        headerLeft: undefined,
        headerRight: () => <NavigationHeaderCloseButton onPress={navigateToSwapForm} />,
        headerTitle: getScreenTitle({ t, webviewCurrentPage, isTransactionComplete }),
      });
    } else if (
      webviewCanGoBack &&
      webviewCurrentPage !== SwapWebviewAllowedPageNames.AccountSelection
    ) {
      navigation.setOptions({
        headerLeft: () => (
          <Flex p={6}>
            <Touchable
              touchableTestID="NavigationHeaderClose"
              onPress={() => goBackWebView(webviewCurrentPage)}
            >
              <Icons.ArrowLeft color={"neutral.c100"} />
            </Touchable>
          </Flex>
        ),
        headerRight: undefined,
        headerTitle: getScreenTitle({ t, webviewCurrentPage }),
      });
    } else {
      navigation.setOptions({
        headerLeft: () => (
          <Flex p={6}>
            <Touchable touchableTestID="NavigationHeaderClose" onPress={goBackNative}>
              <Icons.ArrowLeft color={"neutral.c100"} />
            </Touchable>
          </Flex>
        ),
        headerRight: () => (
          <Flex p={6}>
            <Touchable
              touchableTestID="navigation-header-swap-history"
              onPress={navigateToSwapHistory}
            >
              <Icons.Clock color={"neutral.c100"} />
            </Touchable>
          </Flex>
        ),
        headerTitle: t("transfer.swap2.form.title"),
      });
    }
  }, [
    isSwapTabScreen,
    goBackNative,
    goBackWebView,
    navigateToSwapHistory,
    navigateToSwapForm,
    navigation,
    swapTabScreen?.params,
    t,
  ]);
}
