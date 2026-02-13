import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useSelector } from "~/context/hooks";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

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
  isLwm40Enabled?: boolean;
};
/** Subset of WebPTXPlayer functionality required for Earn live app. */
export const EarnWebview = ({ manifest, inputs, isLwm40Enabled }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(() => {
    if (!webviewAPIRef.current) {
      return false;
    }

    const url = safeUrl(webviewState.url);
    const currentView = url?.searchParams.get("view") as unknown as MobileViewState | null;

    const isInitialWebviewStep = currentView === MobileViewState.AmountInputScreen;
    const isFinalWebviewStep = currentView === MobileViewState.DepositCompleteScreen;

    if (isInitialWebviewStep || isFinalWebviewStep) {
      return false;
    }

    const webview = safeGetRefValue(webviewAPIRef);

    if (webviewState.canGoBack) {
      track("button_clicked", {
        button: "EarnWebviewBack",
        page: ScreenName.Earn,
        webviewPage: currentView,
      });
      webview.goBack();
      return true;
    }

    return false;
  }, [webviewState.canGoBack, webviewState.url]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, [handleHardwareBackPress]),
  );

  useEffect(() => {
    const backHandler = (e: { preventDefault: () => void }) => {
      if (!webviewAPIRef.current) {
        return;
      }

      const url = safeUrl(webviewState.url);
      const currentView = url?.searchParams.get("view");

      const webviewAPI = safeGetRefValue(webviewAPIRef);
      if (webviewState.canGoBack) {
        track("button_clicked", {
          button: "EarnWebviewBack",
          page: ScreenName.Earn,
          webviewPage: currentView,
        });
        webviewAPI.goBack();
        e.preventDefault();
      }
    };

    const url = safeUrl(webviewState.url);
    const currentView = url?.searchParams.get("view");
    const isInitialWebviewStep = currentView === MobileViewState.AmountInputScreen;
    const isFinalWebviewStep = currentView === MobileViewState.DepositCompleteScreen;

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

  const Container = isLwm40Enabled ? View : SafeAreaView;

  return (
    <Container style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
        Loader={() => <Loading backgroundColor="transparent" />}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
