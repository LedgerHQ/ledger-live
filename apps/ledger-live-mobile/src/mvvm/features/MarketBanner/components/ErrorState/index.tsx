import React from "react";
import { View } from "react-native";
import { Text, Spot } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "react-i18next";

const ERROR_CONTAINER_HEIGHT = 110;

export const ErrorState = () => {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    lumenTheme => ({
      container: {
        width: "100%" as const,
        height: ERROR_CONTAINER_HEIGHT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        padding: lumenTheme.spacings.s12,
      },
    }),
    [],
  );

  return (
    <View
      style={styles.container}
      testID="market-banner-error"
      accessibilityRole="alert"
      accessibilityLabel={t("marketBanner.connectionFailed")}
      accessibilityHint={t("marketBanner.errorAccessibilityHint")}
    >
      <Spot appearance="icon" icon={Warning} size={48} />
      <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "center", marginTop: "s8" }}>
        {t("marketBanner.connectionFailed")}
      </Text>
    </View>
  );
};
