import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Box, Button, NavBar, NavBarBackButton } from "@ledgerhq/lumen-ui-rnative";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";

const states: readonly ChecksScreenState[] = [
  "idle",
  "checking",
  "awaitingAllow",
  "succeeded",
  "updating",
];

type DeviceOnboardingDebugViewProps = Readonly<{
  state: ChecksScreenState;
  isScreenOpen: boolean;
  onSelectState: (state: ChecksScreenState) => void;
  onBack: () => void;
  screenProps: ChecksScreenProps;
}>;

export function DeviceOnboardingDebugView({
  state,
  isScreenOpen,
  onSelectState,
  onBack,
  screenProps,
}: DeviceOnboardingDebugViewProps) {
  if (isScreenOpen) {
    return (
      <SafeAreaView style={styles.screen}>
        <ChecksScreen {...screenProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <NavBar density="compact">
        <NavBarBackButton onPress={onBack} accessibilityLabel="Back" />
      </NavBar>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8", padding: "s16" }}>
        {states.map(option => (
          <Button
            key={option}
            size="sm"
            appearance={option === state ? "base" : "gray"}
            onPress={() => onSelectState(option)}
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
