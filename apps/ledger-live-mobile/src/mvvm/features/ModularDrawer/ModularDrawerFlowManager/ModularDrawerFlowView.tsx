import React from "react";
import Animated from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { ModularDrawerStep } from "../types";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import AccountSelection from "../screens/AccountSelection";
import { ModularDrawerFlowProps } from ".";
import useScreenTransition from "./useScreenTransition";
import { useSelector } from "~/context/hooks";
import { modularDrawerStepSelector } from "~/reducers/modularDrawer";

export function ModularDrawerFlowView({
  assetsViewModel,
  networksViewModel,
  accountsViewModel,
}: ModularDrawerFlowProps) {
  const currentStep = useSelector(modularDrawerStepSelector);

  const { activeSteps, getStepAnimations } = useScreenTransition(currentStep);

  const { assetsConfiguration } = assetsViewModel;
  const assetSelectionKey = `${assetsConfiguration?.rightElement ?? "default"}-${assetsConfiguration?.leftElement ?? "default"}`;

  const { networksConfiguration } = networksViewModel;
  const networkSelectionKey = `${networksConfiguration?.rightElement ?? "default"}-${networksConfiguration?.leftElement ?? "default"}`;

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case ModularDrawerStep.Asset:
        return <AssetSelection key={assetSelectionKey} {...assetsViewModel} />;
      case ModularDrawerStep.Network:
        return <NetworkSelection key={networkSelectionKey} {...networksViewModel} />;
      case ModularDrawerStep.Account:
        return <AccountSelection {...accountsViewModel} />;
      default:
        return null;
    }
  };

  const renderAnimatedStep = (step: ModularDrawerStep) => {
    const stepAnimations = getStepAnimations(step);
    if (!stepAnimations) return null;

    return (
      <Animated.View
        key={`${step}`}
        style={[{ flex: 1 }, stepAnimations.animatedStyle]}
        testID={`${step}-screen`}
      >
        {renderStepContent(step)}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} testID="modular-drawer-flow-view">
      {activeSteps.map(renderAnimatedStep)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});
