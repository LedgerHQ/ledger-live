import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import {
  TOP_BAR_CONTENT_HEIGHT,
  TOP_BAR_WRAPPER_PADDING_TOP,
} from "LLM/hooks/useNavigationBarHeights";

type SwapOpaqueHeaderProps = {
  onBackPress: () => void;
  titleKey: string | null;
};

const ICON_PLACEHOLDER_SIZE = 40;

export function SwapOpaqueHeader({ onBackPress, titleKey }: Readonly<SwapOpaqueHeaderProps>) {
  const insets = useSafeAreaInsets();
  const { theme: lumenTheme } = useLumenTheme();
  const { t } = useTranslation();
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        marginTop: insets.top + TOP_BAR_WRAPPER_PADDING_TOP,
        backgroundColor: lumenTheme.colors.bg.base,
      },
    ],
    [insets.top, lumenTheme.colors.bg.base],
  );

  return (
    <Box style={containerStyle}>
      <Box lx={rowLx}>
        <IconButton
          appearance="no-background"
          size="md"
          icon={ArrowLeft}
          testID="swap-topbar-back"
          accessibilityLabel={t("common.back")}
          onPress={onBackPress}
        />

        <Text typography="body1SemiBold" lx={{ color: "base", textAlign: "center", flex: 1 }}>
          {titleKey ? t(titleKey) : ""}
        </Text>

        <Box style={styles.iconPlaceholder} />
      </Box>
    </Box>
  );
}

const rowLx: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  width: "full",
  justifyContent: "space-between",
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    height: TOP_BAR_CONTENT_HEIGHT,
  },
  iconPlaceholder: {
    width: ICON_PLACEHOLDER_SIZE,
  },
});
