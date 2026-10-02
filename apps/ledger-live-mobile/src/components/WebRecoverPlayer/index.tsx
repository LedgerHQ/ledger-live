import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, BackHandler, Platform } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import HeaderTitle from "../HeaderTitle";
import { InfoPanel } from "../WebPlatformPlayer/InfoPanel";
import { RightHeader } from "../WebPlatformPlayer/RightHeader";
import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";
import SafeAreaView from "../SafeAreaView";
import { useDeeplinkCustomHandlers } from "../WebPlatformPlayer/CustomHandlers";
import useRecoverStateSync from "./useRecoverStateSync";

const LOADER_FADE_OUT_DURATION_MS = 250;

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
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, colors } = useTheme();
  const backgroundColor = theme === "dark" ? colors.constant.black : colors.background.main;
  useRecoverStateSync(manifest.id);
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(() => {
    return true; // prevent default behavior (native navigation)
  }, []);

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

  const headerShown = headerShownIds.includes(manifest.id);

  useEffect(() => {
    navigation.setOptions(
      headerShown
        ? {
            headerTitleAlign: "left",
            headerLeft: () => null,
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

  const handleWebviewStateChange = useCallback((state: WebviewState) => {
    setWebviewState(state);
    if (!state.loading && (state.url !== "" || state.isAppUnavailable)) setIsLoaded(true);
  }, []);

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
    <SafeAreaView style={[styles.root, { backgroundColor }]} isFlex edges={["top"]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={handleWebviewStateChange}
        allowsBackForwardNavigationGestures={false}
        customHandlers={customDeeplinkHandlers}
      />
      {isLoaded ? null : (
        <Animated.View
          exiting={FadeOut.duration(LOADER_FADE_OUT_DURATION_MS)}
          style={[styles.loaderOverlay, { backgroundColor }]}
        >
          <Box lx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Spinner />
          </Box>
        </Animated.View>
      )}
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
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
