import React, { useMemo } from "react";
import { StyleSheet, Pressable } from "react-native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { ViewAllTileProps } from "../../types";

// Dark mode colors
const DARK_BACKGROUND_DEFAULT = "#151515";
const DARK_BACKGROUND_PRESSED = "#FFFFFF33";

// Light mode colors
const LIGHT_BACKGROUND_DEFAULT = "#FAFAFA";
const LIGHT_BACKGROUND_PRESSED = "#E8E8E8";

const ViewAllTile = ({ onPress }: ViewAllTileProps) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  const backgroundColors = useMemo(
    () => ({
      default: theme === "light" ? LIGHT_BACKGROUND_DEFAULT : DARK_BACKGROUND_DEFAULT,
      pressed: theme === "light" ? LIGHT_BACKGROUND_PRESSED : DARK_BACKGROUND_PRESSED,
    }),
    [theme],
  );

  return (
    <Pressable
      onPress={onPress}
      testID="market-banner-view-all"
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? backgroundColors.pressed : backgroundColors.default },
      ]}
      accessibilityLabel={t("marketBanner.viewAll")}
      accessibilityHint={t("marketBanner.viewAllAccessibilityHint")}
      accessibilityRole="button"
    >
      <Flex
        width={32}
        height={32}
        borderRadius={16}
        backgroundColor={colors.opacityDefault.c10}
        alignItems="center"
        justifyContent="center"
      >
        <Icons.ChevronRight size="XS" color={colors.neutral.c80} />
      </Flex>
      <Text variant="small" fontWeight="semiBold" color="neutral.c100">
        {t("marketBanner.viewAll")}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 100,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
  },
});

export default React.memo(ViewAllTile);
