import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useSelector } from "react-redux";

import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { CurrentAccountHistDB, safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import { RightHeader } from "./RightHeader";
import { BottomBar } from "./BottomBar";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import HeaderTitle from "../HeaderTitle";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { InfoPanel } from "./InfoPanel";
import { usePTXCustomHandlers } from "../WebPTXPlayer/CustomHandlers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useCurrentAccountHistDB } from "~/screens/Platform/v2/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useACRECustomHandlers } from "./CustomHandlers";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

const WebPlatformPlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

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

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: "left",
      headerLeft: () => null,
      headerTitleContainerStyle: { marginHorizontal: 0 },
      headerTitle: () => (
        <Flex justifyContent={"center"} flex={1}>
          <HeaderTitle color="neutral.c70"> {manifest.homepageUrl}</HeaderTitle>
        </Flex>
      ),
      headerRight: () => (
        <RightHeader
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
          handlePressInfo={() => setIsInfoPanelOpened(true)}
        />
      ),
      headerShown: true,
    });
  }, [manifest, navigation, webviewState]);

  const accounts = useSelector(flattenAccountsSelector);
  const customACREHandlers = useACRECustomHandlers(manifest, accounts);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customACREHandlers,
      ...customPTXHandlers,
    };
  }, [customACREHandlers, customPTXHandlers]);

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
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
    </SafeAreaView>
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
