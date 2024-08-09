import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { CurrentAccountHistDB, safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { AppManifest, WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { useCurrentAccountHistDB } from "~/screens/Platform/v2/hooks";
import { BottomBar } from "./BottomBar";
import { InfoPanel } from "./InfoPanel";

type Props = {
  manifest: AppManifest;
  inputs?: Record<string, string | undefined>;
  onScroll?: ComponentProps<typeof Web3AppWebview>["onScroll"];
  layoutY: SharedValue<number>;
};

const WebPlatformPlayer = ({ manifest, inputs, onScroll, layoutY }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
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

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", handleHardwareBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleHardwareBackPress);
      };
    }
  }, [handleHardwareBackPress]);

  const customPTXHandlers = usePTXCustomHandlers(manifest);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
    };
  }, [customPTXHandlers]);

  return (
    <View style={styles.root}>
      <Web3AppWebview
        ref={webviewAPIRef}
        onScroll={onScroll}
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
      />
      <BottomBar
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        webviewAPIRef={webviewAPIRef}
        webviewState={webviewState}
        layoutY={layoutY}
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
  headerRight: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
