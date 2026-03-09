import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { useSelector } from "~/context/hooks";
import { CurrentAccountHistDB, safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { AppManifest, WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import {
  useACRECustomHandlers,
  useDeeplinkCustomHandlers,
} from "~/components/WebPlatformPlayer/CustomHandlers";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { useCurrentAccountHistDB } from "~/screens/Platform/v2/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { InfoPanel } from "./InfoPanel";
import { AppProps } from "LLM/features/Web3Hub/types";
import Header from "../Header";

type Props = {
  manifest: AppManifest;
  inputs?: Record<string, string | undefined>;
  onScroll?: ComponentProps<typeof Web3AppWebview>["onScroll"];
  webviewState: WebviewState;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
  navigation: AppProps["navigation"];
  initialLoad: boolean;
  secure: boolean;
  baseUrl: string;
};

const WebPlatformPlayer = ({
  manifest,
  inputs,
  onScroll,
  webviewState,
  setWebviewState,
  navigation,
  initialLoad,
  secure,
  baseUrl,
}: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const currentAccountHistDb: CurrentAccountHistDB = useCurrentAccountHistDB();

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

  const accounts = useSelector(flattenAccountsSelector);
  const customACREHandlers = useACRECustomHandlers(manifest, accounts);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customACREHandlers,
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
    };
  }, [customACREHandlers, customPTXHandlers, customDeeplinkHandlers]);

  return (
    <View style={styles.root}>
      <Header
        navigation={navigation}
        initialLoad={initialLoad}
        secure={secure}
        baseUrl={baseUrl}
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        webviewAPIRef={webviewAPIRef}
        webviewState={webviewState}
        setIsInfoPanelOpened={setIsInfoPanelOpened}
      />
      <Web3AppWebview
        ref={webviewAPIRef}
        onScroll={onScroll}
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
      />
      <InfoPanel
        name={manifest.name}
        icon={manifest.icon}
        url={manifest.homepageUrl}
        uri={webviewState.url.toString()}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
    </View>
  );
};

export default WebPlatformPlayer;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
