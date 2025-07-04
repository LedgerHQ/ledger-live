import React from "react";
import { View, Button } from "react-native";
import { useModularDrawerFlowStepManager } from "../hooks/useModularDrawerFlowStepManager";
import { Text } from "@ledgerhq/native-ui";

export type ModularDrawerFlowViewModel = ReturnType<typeof useModularDrawerFlowStepManager>;

export function ModularDrawerFlowView({ viewModel }: { viewModel: ModularDrawerFlowViewModel }) {
  const { currentStep, nextStep, prevStep, reset, isFirstStep, isLastStep, currentStepIndex } =
    viewModel;

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{ fontSize: 24, marginBottom: 16 }}
      >{`Step ${currentStepIndex + 1}: ${currentStep}`}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {!isFirstStep && <Button title="Previous" onPress={prevStep} color="#2196F3" />}
        {!isLastStep && <Button title="Next" onPress={nextStep} color="#4CAF50" />}
        <Button title="Reset" onPress={reset} color="#F44336" />
      </View>
    </View>
  );
}
