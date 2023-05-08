import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import { RightHeader } from "./RightHeader";
import { BottomBar } from "./BottomBar";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import HeaderTitle from "../HeaderTitle";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { InfoPanel } from "./InfoPanel";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

const WebPlatformPlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] =
    useState<WebviewState>(initialWebviewState);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const navigation =
    useNavigation<
      RootNavigationComposite<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

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
      BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        BackHandler.removeEventListener(
          "hardwareBackPress",
          handleHardwareBackPress,
        );
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

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
      />
      <BottomBar
        manifest={manifest}
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
