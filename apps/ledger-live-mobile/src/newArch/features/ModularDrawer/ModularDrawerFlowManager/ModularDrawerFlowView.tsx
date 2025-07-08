import React from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import { ModularDrawerFlowProps } from ".";

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
        // TODO: to be replaced with a proper loading component Skeleton
        <Flex height={50} width="100%" justifyContent="center" alignItems="center">
          <InfiniteLoader color="primary.c50" size={38} />
        </Flex>
      )}
    </Flex>
  );
}
