import React from "react";
import { Text } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import { ModularDrawerFlowProps } from ".";
import SkeletonList from "../components/Skeleton/SkeletonList";
import useScreenTransition from "./useScreenTransition";

export function ModularDrawerFlowView({
  navigationStepViewModel,
  assetsViewModel,
  networksViewModel,
  isReadyToBeDisplayed,
}: ModularDrawerFlowProps) {
  const { currentStep } = navigationStepViewModel;

  const { animatedStyle, displayedStep } = useScreenTransition(currentStep);

  const renderStepContent = () => {
    switch (displayedStep) {
      case ModularDrawerStep.Asset:
        return <AssetSelection {...assetsViewModel} />;
      case ModularDrawerStep.Network:
        return <NetworkSelection {...networksViewModel} />;
      case ModularDrawerStep.Account:
        return <Text>{"Account Selection Step Content"}</Text>;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {isReadyToBeDisplayed ? (
        <>
          <Title step={currentStep} />
          {renderStepContent()}
        </>
      ) : (
        <SkeletonList />
      )}
    </Animated.View>
  );
}
