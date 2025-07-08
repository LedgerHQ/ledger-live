import React from "react";
import { View, Button } from "react-native";
import { useModularDrawerFlowStepManager } from "../hooks/useModularDrawerFlowStepManager";
import { Text } from "@ledgerhq/native-ui";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";

export type ModularDrawerFlowViewModel = ReturnType<typeof useModularDrawerFlowStepManager>;

export function ModularDrawerFlowView({ viewModel }: { viewModel: ModularDrawerFlowViewModel }) {
  const { currentStep, nextStep, prevStep, reset, isFirstStep, isLastStep } = viewModel;

  const renderStepContent = () => {
    switch (currentStep) {
      case ModularDrawerStep.Asset:
        return <AssetSelection assetsToDisplay={[]} />;
      case ModularDrawerStep.Network:
        return <Text>{"Netwok Selection Step Content"}</Text>;
      case ModularDrawerStep.Account:
        return <Text>{"Account Selection Step Content"}</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Title step={currentStep} />
      {renderStepContent()}

      {/* TODO : REMOVE WHEN Navigation between steps is implemented */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {!isFirstStep && <Button title="Previous" onPress={prevStep} color="#2196F3" />}
        {!isLastStep && <Button title="Next" onPress={nextStep} color="#4CAF50" />}
        <Button title="Reset" onPress={reset} color="#F44336" />
      </View>
    </View>
  );
}
