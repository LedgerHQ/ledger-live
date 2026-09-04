import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { InfoState } from "@shared/ui-info-state";
import { StatusGradient } from "LLM/components/StatusGradient";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import { useTranslation } from "~/context/Locale";
import type { PerpsTransactionSignedViewModel } from "./usePerpsTransactionSignedViewModel";

export function PerpsTransactionSignedView({
  receiveCurrencyTicker,
  handleViewTransaction,
  handleClose,
}: Readonly<PerpsTransactionSignedViewModel>) {
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
        <StatusGradient tone="success" testID="perps-transaction-signed-gradient" />
      </View>

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <Box lx={{ paddingHorizontal: "s8", paddingTop: "s8", alignItems: "flex-start" }}>
          <NavigationHeaderCloseButton
            onPress={handleClose}
            testIDSuffix="PerpsTransactionSigned"
          />
        </Box>
        <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingBottom: "s16" }}>
          <InfoState
            preset="success"
            title={t("perpsTransactionSigned.title")}
            description={t("perpsTransactionSigned.description", {
              currency: receiveCurrencyTicker,
            })}
            primaryCta={
              handleViewTransaction
                ? {
                    label: t("perpsTransactionSigned.viewTransaction"),
                    onPress: handleViewTransaction,
                    testID: "perps-transaction-signed-cta",
                  }
                : undefined
            }
            testID="perps-transaction-signed"
          />
        </Box>
      </SafeAreaView>
    </View>
  );
}
