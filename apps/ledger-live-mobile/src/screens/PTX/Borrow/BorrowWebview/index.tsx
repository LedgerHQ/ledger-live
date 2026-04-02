import React, { useCallback, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, BackHandler, Platform } from "react-native";
import { useSelector } from "~/context/hooks";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { useFocusEffect } from "@react-navigation/native";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useBorrowCustomHandlers } from "./useBorrowCustomHandlers";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { Loading } from "~/components/Loading";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

export const BorrowWebview = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const handleHardwareBackPress = useCallback(() => {
    const webview = webviewAPIRef.current;
    if (!webview) return false;

    if (webviewState.canGoBack) {
      safeGetRefValue(webviewAPIRef).goBack();
      return true;
    }

    return false;
  }, [webviewState.canGoBack]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => subscription.remove();
    }, [handleHardwareBackPress]),
  );

  const accounts = useSelector(flattenAccountsSelector);
  const customBorrowHandlers = useBorrowCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      ...customBorrowHandlers,
      ...customDeeplinkHandlers,
    }),
    [customBorrowHandlers, customDeeplinkHandlers],
  );

  return (
    <SafeAreaView style={styles.root}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
        Loader={() => <Loading backgroundColor="transparent" />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
