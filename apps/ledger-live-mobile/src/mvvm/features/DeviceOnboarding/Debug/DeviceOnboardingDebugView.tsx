import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
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
  onSelectState: (state: ChecksScreenState) => void;
  screenProps: ChecksScreenProps;
}>;

export function DeviceOnboardingDebugView({
  state,
  onSelectState,
  screenProps,
}: DeviceOnboardingDebugViewProps) {
  return (
    <Box lx={{ flex: 1 }}>
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
      <Box lx={{ flex: 1 }}>
        <ChecksScreen {...screenProps} />
      </Box>
    </Box>
  );
}
