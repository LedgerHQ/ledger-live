import React, { RefObject, useCallback } from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Lock,
  RefreshBack,
  Warning,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import { AppProps } from "LLM/features/Web3Hub/types";
import { safeGetRefValue, CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import SelectAccountButton from "../Web3Player/SelectAccountButton";

const BAR_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = BAR_HEIGHT;
const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;
const URL_BAR_HEIGHT = 40;
const URL_TEXT_MAX_WIDTH = 128;

type Props = {
  navigation: AppProps["navigation"];
  layoutY: SharedValue<number>;
  initialLoad: boolean;
  secure: boolean;
  baseUrl: string;
  webviewAPIRef: RefObject<WebviewAPI | null>;
  manifest: AppManifest;
  webviewState: WebviewState;
  currentAccountHistDb: CurrentAccountHistDB;
  setIsInfoPanelOpened: (isOpened: boolean) => void;
};

export default function Web3HubAppHeader({
  navigation,
  layoutY,
  initialLoad,
  secure,
  baseUrl,
  webviewAPIRef,
  webviewState,
  manifest,
  currentAccountHistDb,
  setIsInfoPanelOpened,
}: Props) {
  const styles = useStyleSheet(
    theme => ({
      barRow: {
        flex: 1,
        height: BAR_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: theme.spacings.s4,
        gap: theme.spacings.s8,
        backgroundColor: theme.colors.bg.base,
      },
      urlBar: {
        position: "relative",
        flex: 1,
        height: URL_BAR_HEIGHT,
        borderRadius: theme.spacings.s8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacings.s8,
        backgroundColor: theme.colors.bg.muted,
        gap: theme.spacings.s8,
      },
      navGroup: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: -theme.spacings.s8,
      },
      urlCenter: {
        flex: 1,
        position: "absolute",
        left: "50%",
        transform: [{ translateX: "-40%" }],
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacings.s4,
      },
      urlText: {
        maxWidth: URL_TEXT_MAX_WIDTH,
      },
    }),
    [],
  );

  const shouldDisplaySelectAccount = !!manifest.dapp;

  const handleForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goForward();
  }, [webviewAPIRef]);

  const handleBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);
    webview.goBack();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const handleInfoPanel = useCallback(() => {
    setIsInfoPanelOpened(true);
  }, [setIsInfoPanelOpened]);

  return (
    <AnimatedBar
      layoutY={layoutY}
      backgroundColor={styles.barRow.backgroundColor}
      animationHeight={ANIMATION_HEIGHT}
      opacityHeight={TOTAL_HEADER_HEIGHT}
      totalHeight={TOTAL_HEADER_HEIGHT}
      opacityChildren={
        <Box style={styles.barRow}>
          {shouldDisplaySelectAccount ? (
            <SelectAccountButton manifest={manifest} currentAccountHistDb={currentAccountHistDb} />
          ) : (
            <View style={{ width: 24 }} />
          )}

          <View style={styles.urlBar}>
            {initialLoad ? null : (
              <>
                <View style={styles.navGroup}>
                  <IconButton
                    appearance="no-background"
                    size="sm"
                    icon={ChevronLeft}
                    accessibilityLabel="Go back"
                    disabled={!webviewState.canGoBack}
                    onPress={handleBack}
                  />
                  <IconButton
                    appearance="no-background"
                    size="sm"
                    icon={ChevronRight}
                    accessibilityLabel="Go forward"
                    disabled={!webviewState.canGoForward}
                    onPress={handleForward}
                  />
                </View>

                <Pressable style={styles.urlCenter} onPress={handleInfoPanel}>
                  {secure ? <Lock size={12} color="muted" /> : <Warning size={12} color="error" />}
                  <Text
                    typography="body2"
                    lx={{ color: "muted" }}
                    numberOfLines={1}
                    style={styles.urlText}
                  >
                    {baseUrl}
                  </Text>
                </Pressable>

                <TouchableOpacity onPress={handleReload}>
                  <RefreshBack size={20} color="muted" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <IconButton
            appearance="no-background"
            size="sm"
            icon={Close}
            accessibilityLabel="Close"
            aria-label="close"
            accessible
            accessibilityRole="button"
            onPress={navigation.goBack}
          />
        </Box>
      }
    />
  );
}
