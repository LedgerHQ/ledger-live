import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  TOP_BAR_CONTENT_HEIGHT,
  TOP_BAR_WRAPPER_PADDING_TOP,
} from "LLM/hooks/useNavigationBarHeights";
import { useSwapTopBarHeaderViewModel } from "./useSwapTopBarHeaderViewModel";
import {
  CustomTopBar,
  TopBarActionIcon,
  useMyLedgerTopBarAction,
} from "LLM/components/CustomTopBar";

import { Clock } from "@ledgerhq/lumen-ui-rnative/symbols";

export function SwapTopBarHeader() {
  const insets = useSafeAreaInsets();
  const { onMyLedgerPress, onSwapHistoryPress } = useSwapTopBarHeaderViewModel();
  const myLedgerAction = useMyLedgerTopBarAction(onMyLedgerPress);
  const containerStyle = useMemo(
    () => [styles.container, { marginTop: insets.top + TOP_BAR_WRAPPER_PADDING_TOP }],
    [insets.top],
  );

  const leadingIcons = useMemo(() => [myLedgerAction], [myLedgerAction]);

  const trailingIcons: readonly TopBarActionIcon[] = useMemo(
    () => [
      {
        id: "swap-history",
        icon: Clock,
        callback: onSwapHistoryPress,
        testID: "topbar-swap-history",
        accessibilityLabel: "Swap History",
      },
    ],
    [onSwapHistoryPress],
  );

  return (
    <Box style={containerStyle}>
      <CustomTopBar leadingIcons={leadingIcons} trailingIcons={trailingIcons} />
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
