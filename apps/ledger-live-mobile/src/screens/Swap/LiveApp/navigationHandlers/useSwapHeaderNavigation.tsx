import React, { useCallback, useEffect } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { useTrack } from "~/analytics";
import { SWAP_VERSION } from "~/screens/Swap/utils";
import { useTranslation } from "~/context/Locale";
import { DefaultAccountSwapParamList, DetailsSwapParamList } from "~/screens/Swap/types";
import Touchable from "~/components/Touchable";
import { SwapWebviewAllowedPageNames, WebviewAPI } from "~/components/Web3AppWebview/types";
import { useIsSwapTab } from "./useIsSwapTab";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";

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

export function useSwapHeaderNavigation(webviewRef: React.RefObject<WebviewAPI | null>) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const track = useTrack();

  const { isSwapTabScreen, swapTabScreen } = useIsSwapTab();

  const navigateToSwapHistory = useCallback(() => {
    track("button_clicked", {
      button: "SwapHistory",
      page: ScreenName.SwapTab,
      swapVersion: SWAP_VERSION,
    });

    navigation.navigate(ScreenName.SwapHistory);
  }, [navigation, track]);

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

    const webviewParams = swapTabScreen?.params;

    const webviewCanGoBack = (webviewParams as DetailsSwapParamList | DefaultAccountSwapParamList)
      ?.swapNavigationParams?.canGoBack;

    const webviewCurrentPage = (webviewParams as DetailsSwapParamList | DefaultAccountSwapParamList)
      ?.swapNavigationParams?.page;

    const isTransactionComplete = (
      webviewParams as DetailsSwapParamList | DefaultAccountSwapParamList
    )?.swapNavigationParams?.isTransactionComplete;

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
