import React from "react";
import Animated from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import AccountSelection from "../screens/AccountSelection";
import { ModularDrawerFlowProps } from ".";
import SkeletonList from "../components/Skeleton/SkeletonList";
import useScreenTransition from "./useScreenTransition";

export function ModularDrawerFlowView({
  navigationStepViewModel,
  assetsViewModel,
  networksViewModel,
  accountsViewModel,
  isReadyToBeDisplayed,
}: ModularDrawerFlowProps) {
  const { currentStep } = navigationStepViewModel;

  const { activeSteps, getStepAnimations } = useScreenTransition(currentStep);

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case ModularDrawerStep.Asset:
        return <AssetSelection {...assetsViewModel} />;
      case ModularDrawerStep.Network:
        return <NetworkSelection {...networksViewModel} />;
      case ModularDrawerStep.Account:
        return <AccountSelection {...accountsViewModel} />;
      default:
        return null;
    }
  };

  const renderAnimatedStep = (step: ModularDrawerStep, index: number) => {
    const stepAnimations = getStepAnimations(step);

    if (!stepAnimations) return null;

    return (
      <Animated.View
        key={`${step}-${index}`}
        style={[{ flex: 1 }, stepAnimations.animatedStyle]}
        testID={`${step}-screen`}
      >
        {isReadyToBeDisplayed ? (
          <>
            <Title step={step} />
            {renderStepContent(step)}
          </>
        ) : (
          <SkeletonList />
        )}
      </Animated.View>
    );
  };

  return <View style={styles.container}>{activeSteps.map(renderAnimatedStep)}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});
