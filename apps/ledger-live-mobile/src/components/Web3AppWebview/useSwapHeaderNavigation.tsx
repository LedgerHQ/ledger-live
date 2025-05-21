import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useIsSwapTab } from "./useIsSwapTab";
import { Flex, Icons } from "@ledgerhq/native-ui";
import Touchable from "../Touchable";
import { ScreenName } from "~/const";
import { useTrack } from "~/analytics";
import { SWAP_VERSION } from "~/screens/Swap/utils";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { SwapWebviewAllowedPageNames } from "./types";

function getScreenTitle({
  webviewCurrentPage,
  t,
}: {
  webviewCurrentPage: SwapWebviewAllowedPageNames;
  t: (key: string) => string;
}) {
  switch (webviewCurrentPage) {
    case SwapWebviewAllowedPageNames.TwoStepApproval:
      return t("transfer.swap2.twoStepApproval.title");
    case SwapWebviewAllowedPageNames.QuotesList:
      return t("transfer.swap2.quotesList.title");
    default:
      return t("transfer.swap2.form.title");
  }
}

export function useSwapHeaderNavigation(webviewRef: React.RefObject<WebView>) {
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
    (currentWebviewPage: SwapWebviewAllowedPageNames) => {
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

  if (isSwapTabScreen) {
    const webviewParams = swapTabScreen?.params;

    // @ts-expect-error the params object exists and is typed in ./helpers.ts through its setter function, but seems to be not recognized here
    const webviewCanGoBack = webviewParams?.params?.canGoBack;
    // @ts-expect-error the params object exists and is typed in ./helpers.ts through its setter function, but seems to be not recognized here
    const webviewCurrentPage = webviewParams?.params?.page;

    if (webviewCanGoBack && webviewCurrentPage !== SwapWebviewAllowedPageNames.AccountSelection) {
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
              touchableTestID="NavigationHeaderSwapHistory"
              onPress={navigateToSwapHistory}
            >
              <Icons.Clock color={"neutral.c100"} />
            </Touchable>
          </Flex>
        ),
        headerTitle: t("transfer.swap2.form.title"),
      });
    }
  }
}
