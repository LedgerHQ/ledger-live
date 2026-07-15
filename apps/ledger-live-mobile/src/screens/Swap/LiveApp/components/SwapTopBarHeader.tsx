import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, type IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import {
  TOP_BAR_CONTENT_HEIGHT,
  TOP_BAR_WRAPPER_PADDING_TOP,
  useAdjustedSafeAreaInsets,
} from "LLM/hooks/useNavigationBarHeights";
import { useSwapTopBarHeaderViewModel } from "./useSwapTopBarHeaderViewModel";
import {
  CustomTopBar,
  TopBarActionIcon,
  useMyLedgerTopBarAction,
} from "LLM/components/CustomTopBar";
import { MyWalletTopBarAction } from "LLM/components/TopBar/components/MyWalletTopBarAction";
import { SyncErrorBottomSheet } from "LLM/components/TopBar/components/SyncErrorBottomSheet";
import { ICON_SIZE } from "LLM/components/TopBar/const";

import { Clock, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";

const syncIcon: IconButtonProps["icon"] = ({ size, style }) => (
  <Warning size={size ?? ICON_SIZE} style={style} color="base" />
);

export function SwapTopBarHeader() {
  const insets = useAdjustedSafeAreaInsets();
  const {
    onMyLedgerPress,
    onMyWalletPress,
    shouldDisplayMyWallet,
    hasUnreadNotifications,
    onSwapHistoryPress,
    hasAccounts,
    isSyncError,
    isSyncPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    isSyncDrawerOpen,
    openSyncDrawer,
    closeSyncDrawer,
    onTryRefresh,
  } = useSwapTopBarHeaderViewModel();
  const myLedgerAction = useMyLedgerTopBarAction(onMyLedgerPress);
  const containerStyle = useMemo(
    () => [styles.container, { marginTop: insets.top + TOP_BAR_WRAPPER_PADDING_TOP }],
    [insets.top],
  );

  const leadingElement = shouldDisplayMyWallet ? (
    <MyWalletTopBarAction onPress={onMyWalletPress} showNotification={hasUnreadNotifications} />
  ) : undefined;

  const leadingIcons = useMemo(
    () => (shouldDisplayMyWallet ? [] : [myLedgerAction]),
    [shouldDisplayMyWallet, myLedgerAction],
  );

  const displaySyncStatusIcon = hasAccounts && isSyncError;

  const trailingIcons: readonly TopBarActionIcon[] = useMemo(() => {
    const icons: TopBarActionIcon[] = [];

    if (displaySyncStatusIcon) {
      icons.push({
        id: "sync",
        icon: syncIcon,
        callback: openSyncDrawer,
        testID: "topbar-sync",
        accessibilityLabel: syncAccessibilityLabel,
        loading: isSyncPending,
      });
    }

    icons.push({
      id: "swap-history",
      icon: Clock,
      callback: onSwapHistoryPress,
      testID: "topbar-swap-history",
      accessibilityLabel: "Swap History",
    });

    return icons;
  }, [
    displaySyncStatusIcon,
    openSyncDrawer,
    syncAccessibilityLabel,
    isSyncPending,
    onSwapHistoryPress,
  ]);

  return (
    <Box style={containerStyle}>
      <CustomTopBar
        leadingElement={leadingElement}
        leadingIcons={leadingIcons}
        trailingIcons={trailingIcons}
      />

      <SyncErrorBottomSheet
        isOpen={isSyncDrawerOpen}
        onClose={closeSyncDrawer}
        listOfErrorAccountNames={listOfErrorAccountNames}
        onTryRefresh={onTryRefresh}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "transparent",
    height: TOP_BAR_CONTENT_HEIGHT,
  },
});
