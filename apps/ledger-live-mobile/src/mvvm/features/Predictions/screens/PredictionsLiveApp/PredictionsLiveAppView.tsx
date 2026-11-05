import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, NavBar, NavBarBackButton, Spinner } from "@ledgerhq/lumen-ui-rnative";
import GenericErrorView from "~/components/GenericErrorView";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { useTranslation } from "~/context/Locale";
import type { PredictionsLiveAppViewModel } from "./usePredictionsLiveAppViewModel";

export function PredictionsLiveAppView({
  manifest,
  error,
  isLoading,
  webviewInputs,
  customHandlers,
  webviewRef,
  onWebviewStateChange,
  onBack,
}: PredictionsLiveAppViewModel) {
  const { t } = useTranslation();

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <NavBar density="compact">
          <NavBarBackButton onPress={onBack} accessibilityLabel={t("common.back")} />
        </NavBar>
        <Box lx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {isLoading ? <Spinner size={32} /> : <GenericErrorView error={error} />}
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID="predictions-screen">
      {manifest && (
        <Web3AppWebview
          ref={webviewRef}
          manifest={manifest}
          inputs={webviewInputs}
          customHandlers={customHandlers}
          onStateChange={onWebviewStateChange}
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
