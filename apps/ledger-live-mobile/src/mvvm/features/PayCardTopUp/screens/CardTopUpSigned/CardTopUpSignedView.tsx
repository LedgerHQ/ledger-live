import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state";
import { StatusGradient } from "LLM/components/StatusGradient";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";

const KEY_PREFIX = "payTab.cardTopUp";

export function CardTopUpSignedView({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      gradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      safeArea: {
        flex: 1,
      },
    }),
    [],
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.gradient}>
        <StatusGradient tone="success" />
      </View>

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <Box lx={{ paddingHorizontal: "s8", paddingTop: "s8", alignItems: "flex-start" }}>
          <NavigationHeaderCloseButton onPress={onClose} testIDSuffix="PayCardTopUpSigned" />
        </Box>
        <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingBottom: "s16" }}>
          <InfoState
            preset="success"
            title={t(`${KEY_PREFIX}.successTitle`)}
            description={t(`${KEY_PREFIX}.successDescription`)}
            primaryCta={{
              label: t(`${KEY_PREFIX}.done`),
              onPress: onClose,
              testID: "card-top-up-done",
            }}
            testID="card-top-up-signed"
          />
        </Box>
      </SafeAreaView>
    </View>
  );
}
