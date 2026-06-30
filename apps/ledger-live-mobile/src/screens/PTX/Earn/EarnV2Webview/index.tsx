import { isMinEarnUiVersion } from "@ledgerhq/live-common/domain/isMinEarnUiVersion";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex } from "@ledgerhq/native-ui";
import React, { ComponentProps, Fragment, useRef, useCallback, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import type WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import GenericErrorView from "~/components/GenericErrorView";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { EarnWebview } from "../EarnWebview";
import { LiveAppBackground } from "LLM/components/LiveAppBackground";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { computeEarnUiVersion } from "@ledgerhq/live-common/domain/computeEarnUiVersion";
import type { WebviewState } from "~/components/Web3AppWebview/types";
import { useEarnIntentFlowPresentation } from "../useEarnIntentFlowPresentation";

type Props = {
  manifest?: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  isLwm40Enabled?: boolean;
  hideMainNavigator?: boolean;
  appManifestNotFoundError: Error;
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "visible" },
  contentContainer: { flex: 1, zIndex: 1 },
});

export const EarnV2Webview = ({
  manifest,
  inputs,
  isLwm40Enabled,
  hideMainNavigator,
  appManifestNotFoundError,
}: Props) => {
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const insets = useSafeAreaInsets();
  const { theme: lumenTheme } = useLumenTheme();
  const canvasColor = lumenTheme.colors.bg.canvas;
  const isSimulateIntent = inputs?.intent === "simulate";
  const { topBarHeight, bottomBarHeight } = useNavigationBarHeights();
  const { shouldDisplayEarnUpselling, shouldDisplayEarnSimulator } =
    useWalletFeaturesConfig("mobile");

  const earnUiVersion = useFeature("ptxEarnUi")?.params?.value ?? "v2";

  const computedUiVersion = computeEarnUiVersion({
    baseUiVersion: earnUiVersion,
    shouldDisplayEarnUpselling,
    shouldDisplayEarnSimulator,
  });

  const isPtxUiMinV2 = isMinEarnUiVersion(computedUiVersion, "v2");

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useCallback<NonNullable<ComponentProps<typeof WebView>["onScroll"]>>(
    event => {
      scrollY.setValue(event.nativeEvent.contentOffset.y);
    },
    [scrollY],
  );

  const [webviewUrl, setWebviewUrl] = useState<string | undefined>(undefined);
  const webviewUrlRef = useRef<string | undefined>(undefined);
  const handleWebviewStateChange = useCallback((state: WebviewState) => {
    webviewUrlRef.current = state.url;
    setWebviewUrl(state.url);
  }, []);

  const { intentFlowState } = useEarnIntentFlowPresentation({
    hideMainNavigator,
    webviewUrl,
    webviewUrlRef,
    canvasColor,
  });

  const inIntentFlow = !!hideMainNavigator && intentFlowState !== false;
  const showsBackground = isPtxUiMinV2 && !inIntentFlow;

  const webviewInputs = {
    ...inputs,
    safeAreaTop: insets.top.toString(),
    safeAreaBottom: insets.bottom.toString(),
    safeAreaLeft: insets.left.toString(),
    safeAreaRight: insets.right.toString(),
    topNavigationHeightOffset: topBarHeight.toString(),
    bottomNavigationHeightOffset: bottomBarHeight.toString(),
    uiVersion: computedUiVersion,
    lw40enabled: isLwm40Enabled ? "true" : "false",
  };

  return (
    <View
      testID="earn-screen"
      style={[styles.container, isSimulateIntent && { backgroundColor: canvasColor }]}
    >
      {showsBackground && <LiveAppBackground type="earn" scrollY={scrollY} />}
      <View style={styles.contentContainer} pointerEvents="box-none">
        {manifest ? (
          <Fragment>
            <TrackScreen category="EarnDashboard" name="Earn" />
            <EarnWebview
              manifest={manifest}
              inputs={webviewInputs}
              isLwm40Enabled={isLwm40Enabled}
              onScroll={showsBackground ? handleScroll : undefined}
              onWebviewStateChange={handleWebviewStateChange}
            />
          </Fragment>
        ) : (
          !remoteLiveAppState.isLoading && (
            <Flex flex={1} p={10} justifyContent="center" alignItems="center">
              <GenericErrorView error={appManifestNotFoundError} />
            </Flex>
          )
        )}
      </View>
    </View>
  );
};
