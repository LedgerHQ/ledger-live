import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useSelector } from "~/context/hooks";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import { useNavigation } from "@react-navigation/native";

import { flattenAccountsSelector } from "~/reducers/accounts";

import { useEarnCustomHandlers } from "./useEarnWebviewCustomHandlers";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { Loading } from "~/components/Loading";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { track } from "~/analytics";
import { ScreenName } from "~/const/navigation";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";

export enum MobileViewState {
  AmountInputScreen = "amount",
  SelectProviderScreen = "providers",
  ApproveScreen = "approve",
  DepositCompleteScreen = "confirmation",
  DepositFailedScreen = "failed",
}

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};
/** Subset of WebPTXPlayer functionality required for Earn live app. */
export const EarnWebview = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(
    (currentView: MobileViewState | null) => {
      const webview = safeGetRefValue(webviewAPIRef);

      if (webviewState.canGoBack) {
        track("button_clicked", {
          button: "EarnWebviewBack",
          page: ScreenName.Earn,
          webviewPage: currentView,
        });
        webview.goBack();
        return true; // prevent default behavior (native navigation)
      }

      return false;
    },
    [webviewState.canGoBack],
  );

  useEffect(() => {
    const url = safeUrl(webviewState.url);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currentView = url?.searchParams.get("view") as unknown as MobileViewState | null;

    const isInitialWebviewStep = currentView === MobileViewState.AmountInputScreen;
    const isFinalWebviewStep = currentView === MobileViewState.DepositCompleteScreen;

    const webviewBackHandler = () => handleHardwareBackPress(currentView);

    if (Platform.OS === "android" && !isInitialWebviewStep && !isFinalWebviewStep) {
      const subscription = BackHandler.addEventListener("hardwareBackPress", webviewBackHandler);

      return () => {
        subscription.remove();
      };
    }
  }, [handleHardwareBackPress, navigation, webviewState.url]);

  useEffect(() => {
    const backHandler = (e: { preventDefault: () => void }) => {
      const webviewAPI = safeGetRefValue(webviewAPIRef);
      if (webviewState.canGoBack) {
        track("button_clicked", {
          button: "EarnWebviewBack",
          page: ScreenName.Earn,
          webviewPage: safeUrl(webviewState.url)?.searchParams.get("view"),
        });
        // go back in webview
        webviewAPI.goBack();
        e.preventDefault();
      }
    };

    const url = safeUrl(webviewState.url);
    const isInitialWebviewStep = url?.searchParams.get("view") === "amount";
    const isFinalWebviewStep = url?.searchParams.get("view") === "confirmation";

    if (isInitialWebviewStep || isFinalWebviewStep) {
      navigation.removeListener("beforeRemove", backHandler);
    } else {
      navigation.addListener("beforeRemove", backHandler);
    }
    return () => {
      navigation.removeListener("beforeRemove", backHandler);
    };
  }, [webviewState.canGoBack, navigation, webviewState.url]);

  const accounts = useSelector(flattenAccountsSelector);
  const customEarnHandlers = useEarnCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...customEarnHandlers,
      ...customDeeplinkHandlers,
    };
  }, [customEarnHandlers, customDeeplinkHandlers]);

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
      />
      {webviewState.loading ? <Loading /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
