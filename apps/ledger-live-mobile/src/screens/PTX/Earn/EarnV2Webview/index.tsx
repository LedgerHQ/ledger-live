import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex } from "@ledgerhq/native-ui";
import React, { ComponentProps, Fragment, useRef, useCallback } from "react";
import { Animated, View } from "react-native";
import type WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import GenericErrorView from "~/components/GenericErrorView";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { EarnWebview } from "../EarnWebview";
import { EarnBackground } from "../EarnBackground";

type Props = {
  manifest?: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  isLwm40Enabled?: boolean;
  hideMainNavigator?: boolean;
  appManifestNotFoundError: Error;
};

export const EarnV2Webview = ({
  manifest,
  inputs,
  isLwm40Enabled,
  hideMainNavigator,
  appManifestNotFoundError,
}: Props) => {
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const insets = useSafeAreaInsets();
  const { topBarHeight, bottomBarHeight } = useNavigationBarHeights();
  const earnUiFlag = useFeature("ptxEarnUi");
  const earnUiVersion = earnUiFlag?.params?.value ?? "v1";
  const isPtxUiV2 = earnUiVersion === "v2" || earnUiVersion === "2";

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useCallback<NonNullable<ComponentProps<typeof WebView>["onScroll"]>>(
    event => {
      scrollY.setValue(event.nativeEvent.contentOffset.y);
    },
    [scrollY],
  );

  const webviewInputs = {
    ...inputs,
    safeAreaTop: insets.top.toString(),
    safeAreaBottom: insets.bottom.toString(),
    safeAreaLeft: insets.left.toString(),
    safeAreaRight: insets.right.toString(),
    topNavigationHeightOffset: topBarHeight.toString(),
    bottomNavigationHeightOffset: bottomBarHeight.toString(),
    uiVersion: earnUiVersion,
    lw40enabled: isLwm40Enabled ? "true" : "false",
  };

  return (
    <View style={{ flex: 1, overflow: "visible" }}>
      {isPtxUiV2 && !hideMainNavigator && <EarnBackground scrollY={scrollY} />}
      <View style={{ flex: 1, zIndex: 1 }} pointerEvents="box-none">
        {manifest ? (
          <Fragment>
            <TrackScreen category="EarnDashboard" name="Earn" />
            <EarnWebview
              manifest={manifest}
              inputs={webviewInputs}
              isLwm40Enabled={isLwm40Enabled}
              onScroll={isPtxUiV2 && !hideMainNavigator ? handleScroll : undefined}
            />
          </Fragment>
        ) : (
          !remoteLiveAppState.isLoading && ( // if the manifest is not found, show the error screen
            <Flex flex={1} p={10} justifyContent="center" alignItems="center">
              <GenericErrorView error={appManifestNotFoundError} />
            </Flex>
          )
        )}
      </View>
    </View>
  );
};
