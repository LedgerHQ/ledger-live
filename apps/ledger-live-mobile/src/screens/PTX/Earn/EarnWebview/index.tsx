import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useSelector } from "react-redux";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import { useNavigation } from "@react-navigation/native";

import { flattenAccountsSelector } from "~/reducers/accounts";

import { useEarnCustomHandlers } from "./useEarnWebviewCustomHandlers";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { Loading } from "~/components/Loading";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  disableHeader?: boolean;
  softExit?: boolean;
};
/** Subset of WebPTXPlayer functionality required for Earn live app. */
export const EarnWebview = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    if (webviewState.canGoBack) {
      webview.goBack();
      return true; // prevent default behavior (native navigation)
    }

    return false;
  }, [webviewState.canGoBack, webviewAPIRef]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        subscription.remove();
      };
    }
  }, [handleHardwareBackPress]);

  useEffect(() => {
    const backHandler = (e: { preventDefault: () => void }) => {
      const webviewAPI = safeGetRefValue(webviewAPIRef);
      if (webviewState.canGoBack) {
        webviewAPI.goBack();
        e.preventDefault();
      }
    };

    const url = safeUrl(webviewState.url);
    const isInitialWebviewStep = url?.searchParams.get("view") === "amount";

    if (isInitialWebviewStep) {
      navigation.removeListener("beforeRemove", backHandler);
    } else {
      navigation.addListener("beforeRemove", backHandler);
    }
    return () => {
      navigation.removeListener("beforeRemove", backHandler);
    };
  }, [webviewState.canGoBack, navigation, webviewState.url]);

  const accounts = useSelector(flattenAccountsSelector);
  const customHandlers = useEarnCustomHandlers(manifest, accounts);

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
