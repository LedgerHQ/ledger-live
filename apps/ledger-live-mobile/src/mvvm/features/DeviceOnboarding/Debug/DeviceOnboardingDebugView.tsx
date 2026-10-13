import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Box, Button, NavBar, NavBarBackButton } from "@ledgerhq/lumen-ui-rnative";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { OfferScreen } from "LLM/features/DeviceOnboarding/screens/Offer";
import type { OfferScreenProps } from "LLM/features/DeviceOnboarding/screens/Offer/useOfferScreenViewModel";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";

const states: readonly ChecksScreenState[] = [
  "synchronizing",
  "idle",
  "checking",
  "awaitingAllow",
  "succeeded",
  "updating",
];

const previews = [...states, "offer"] as const;

type Preview = (typeof previews)[number];

type DeviceOnboardingDebugViewProps = Readonly<{
  preview: Preview;
  isScreenOpen: boolean;
  onSelectPreview: (preview: Preview) => void;
  onBack: () => void;
  screenProps: ChecksScreenProps;
  offerProps: OfferScreenProps;
}>;

export function DeviceOnboardingDebugView({
  preview,
  isScreenOpen,
  onSelectPreview,
  onBack,
  screenProps,
  offerProps,
}: DeviceOnboardingDebugViewProps) {
  if (isScreenOpen) {
    return (
      <SafeAreaView style={styles.screen}>
        {preview === "offer" ? <OfferScreen {...offerProps} /> : <ChecksScreen {...screenProps} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <NavBar density="compact">
        <NavBarBackButton onPress={onBack} accessibilityLabel="Back" />
      </NavBar>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8", padding: "s16" }}>
        {previews.map(option => (
          <Button
            key={option}
            size="sm"
            appearance={option === preview ? "base" : "gray"}
            onPress={() => onSelectPreview(option)}
          >
            {option}
          </Button>
        ))}
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
