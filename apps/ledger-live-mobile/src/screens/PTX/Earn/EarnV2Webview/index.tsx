import { isMinEarnUiVersion } from "@ledgerhq/live-common/domain/isMinEarnUiVersion";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex } from "@ledgerhq/native-ui";
import React, { ComponentProps, Fragment, useRef, useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import type WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";
import { TrackScreen } from "~/analytics";
import GenericErrorView from "~/components/GenericErrorView";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { NavigatorName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EarnWebview } from "../EarnWebview";
import { LiveAppBackground } from "LLM/components/LiveAppBackground";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { computeEarnUiVersion } from "@ledgerhq/live-common/domain/computeEarnUiVersion";
import type { WebviewState } from "~/components/Web3AppWebview/types";

const INTENT_FLOWS = ["deposit", "withdraw", "simulate"];
const INTENTS_SET = new Set(INTENT_FLOWS);

/**
 * The native Earn screen sets `intent` once on entry and never clears it, so it cannot be trusted
 * after the user navigates back inside the webview (e.g. "go to dashboard"). The live webview URL
 * is the source of truth for whether we are still inside an intent flow (deposit/withdraw/simulate).
 *
 * Returns `true` when on an intent flow route, `false` when on a known non-intent route, and
 * `null` while the URL is unknown (e.g. the webview's initial empty state, or transient non-http(s)
 * schemes like `about:blank`/`data:` reported during load). The `null` case must NOT be treated as
 * "left the intent flow", otherwise we would bounce out of the intent flow on first mount before its
 * route has even loaded. Only http(s) URLs count as a known route.
 */
const getIntentFlowState = (rawUrl?: string): boolean | null => {
  if (!rawUrl) return null;
  const url = safeUrl(rawUrl);
  if (!url) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (INTENTS_SET.has(url.searchParams.get("intent") ?? "")) return true;
  return INTENT_FLOWS.some(segment => url.pathname.includes(segment));
};

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
  // The simulator uses the live-app canvas (pure black in Wallet 4.0 dark) for the whole screen.
  // Paint the area behind the webview so the loading state matches the content and native header
  // (no gray flash before the webview paints). Scoped to `simulate` so deposit/withdraw keep the
  // default background.
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

  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const [webviewUrl, setWebviewUrl] = useState<string | undefined>(undefined);
  const handleWebviewStateChange = useCallback((state: WebviewState) => {
    setWebviewUrl(state.url);
  }, []);

  const intentFlowState = getIntentFlowState(webviewUrl);

  /** Until the webview reports a *known* URL (`null` while unknown/empty on first mount), trust the
   * native `intent` (correct first paint on intent flow entry). Once it reports a known non-intent
   * route, the URL wins: returning to the dashboard restores the background even though the stale
   * native `intent` is still set. Only `false` (a known non-intent route) leaves intent flow mode;
   * `null` (unknown) must keep intent flow mode so we don't bounce out before the route loads.
   */
  const inIntentFlow = !!hideMainNavigator && intentFlowState !== false;
  const showsBackground = isPtxUiMinV2 && !inIntentFlow;

  /** An intent flow (deposit/withdraw/simulate) is rendered full-screen via the Base navigator
   * (header, no tab bar). When the webview navigates back out of the intent route (e.g. "go to
   * dashboard"), that in-webview navigation cannot leave the Base-stack screen on its own, so the
   * main navigation (top bar + tab bar) and background stay hidden. Detect the exit and return to
   * the Earn dashboard tab, which restores the full chrome. Guarded by `hideMainNavigator` so it
   * only runs for the intent flow presentation, never the dashboard tab instance.
   */
  useEffect(() => {
    if (!hideMainNavigator) return;
    // Only exit on a *known* non-intent route. `null` (unknown/initial empty URL) and `true`
    // (still in an intent flow) must not trigger navigation, or we'd bounce out on entry.
    if (intentFlowState !== false) return;
    navigation.navigate(NavigatorName.Main, { screen: NavigatorName.Earn });
  }, [hideMainNavigator, intentFlowState, navigation]);

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
