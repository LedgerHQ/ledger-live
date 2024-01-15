import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useDispatch } from "react-redux";

import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import HeaderTitle from "../HeaderTitle";
import { InfoPanel } from "../WebPlatformPlayer/InfoPanel";
import { RightHeader } from "../WebPlatformPlayer/RightHeader";
import extraStatusBarPadding from "~/logic/extraStatusBarPadding";

import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

const headerShownIds = [
  "protect-local",
  "protect-local-dev",
  "protect-simu",
  "protect-staging",
  "protect-staging-v2",
];

const WebRecoverPlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);
  const dispatch = useDispatch();

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(() => {
    return true; // prevent default behavior (native navigation)
  }, []);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", handleHardwareBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleHardwareBackPress);
      };
    }
  }, [handleHardwareBackPress]);

  const headerShown = headerShownIds.includes(manifest.id);

  useEffect(() => {
    navigation.setOptions(
      headerShown
        ? {
            headerTitleAlign: "left",
            headerLeft: () => null,
            headerTitleContainerStyle: { marginHorizontal: 0 },
            headerTitle: () => (
              <Flex justifyContent={"center"} flex={1}>
                <HeaderTitle color="neutral.c70">{manifest.homepageUrl}</HeaderTitle>
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
          }
        : {
            headerShown: false,
          },
    );
  }, [headerShown, manifest, navigation, webviewState]);

  const handleBypassOnboarding = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(false));
    dispatch(setHasOrderedNano(false));
  }, [dispatch]);

  useEffect(() => {
    if (!webviewState?.url) return;

    const url = new URL(webviewState.url);
    const paramBypassOnboarding = url.searchParams.get("bypassLLOnboarding");

    if (paramBypassOnboarding === "true") handleBypassOnboarding();
  }, [handleBypassOnboarding, webviewState]);

  return (
    <SafeAreaView style={[styles.root, { paddingTop: !headerShown ? extraStatusBarPadding : 0 }]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        allowsBackForwardNavigationGestures={false}
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

export default WebRecoverPlayer;

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
