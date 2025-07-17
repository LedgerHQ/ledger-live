import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import { ModularDrawerFlowProps } from ".";
import SkeletonList from "../components/Skeleton/SkeletonList";

export function ModularDrawerFlowView({
  navigationStepViewModel,
  assetsViewModel,
  networksViewModel,
  isReadyToBeDisplayed,
}: ModularDrawerFlowProps) {
  const { currentStep } = navigationStepViewModel;

  const renderStepContent = () => {
    switch (currentStep) {
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
    <Flex flexDirection="column" rowGap={5}>
      {isReadyToBeDisplayed ? (
        <>
          <Title step={currentStep} />
          {renderStepContent()}
        </>
      ) : (
        <SkeletonList />
      )}
    </Flex>
  );
}
