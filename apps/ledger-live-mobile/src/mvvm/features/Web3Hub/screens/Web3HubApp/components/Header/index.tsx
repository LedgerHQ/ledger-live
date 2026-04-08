import React, { type RefObject } from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
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
import type { AppProps } from "LLM/features/Web3Hub/types";
import type { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import type { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import SelectAccountButton from "../Web3Player/SelectAccountButton";
import useHeaderViewModel, { type HeaderViewModelValues } from "./useHeaderViewModel";

const BAR_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = BAR_HEIGHT;
const URL_BAR_HEIGHT = 40;
const URL_TEXT_MAX_WIDTH = 128;

export type Web3HubAppHeaderProps = {
  navigation: AppProps["navigation"];
  initialLoad: boolean;
  secure: boolean;
  baseUrl: string;
  manifest: AppManifest;
  webviewState: WebviewState;
  setCurrentAccountHistDb: SetCurrentAccountHistDb;
};

type HeaderViewProps = Web3HubAppHeaderProps & HeaderViewModelValues;

const HeaderView = ({
  navigation,
  initialLoad,
  secure,
  baseUrl,
  manifest,
  webviewState,
  setCurrentAccountHistDb,
  shouldDisplaySelectAccount,
  onForward,
  onBack,
  onReload,
  onInfoPanel,
}: HeaderViewProps) => {
  const styles = useStyleSheet(
    theme => ({
      barRow: {
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

  return (
    <Box style={styles.barRow}>
      {shouldDisplaySelectAccount ? (
        <SelectAccountButton
          manifest={manifest}
          setCurrentAccountHistDb={setCurrentAccountHistDb}
        />
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
                onPress={onBack}
              />
              <IconButton
                appearance="no-background"
                size="sm"
                icon={ChevronRight}
                accessibilityLabel="Go forward"
                disabled={!webviewState.canGoForward}
                onPress={onForward}
              />
            </View>

            <Pressable style={styles.urlCenter} onPress={onInfoPanel}>
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

            <TouchableOpacity onPress={onReload}>
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
  );
};

type ContainerProps = Web3HubAppHeaderProps & {
  webviewAPIRef: RefObject<WebviewAPI | null>;
  setIsInfoPanelOpened: (isOpened: boolean) => void;
};

export default function Web3HubAppHeader({
  webviewAPIRef,
  setIsInfoPanelOpened,
  ...rest
}: ContainerProps) {
  const viewModel = useHeaderViewModel({
    webviewAPIRef,
    manifest: rest.manifest,
    setIsInfoPanelOpened,
  });

  return <HeaderView {...rest} {...viewModel} />;
}

export { HeaderView };
