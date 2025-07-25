import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import AccountSelection from "../screens/AccountSelection";
import { ModularDrawerFlowProps } from ".";
import SkeletonList from "../components/Skeleton/SkeletonList";

export function ModularDrawerFlowView({
  navigationStepViewModel,
  assetsViewModel,
  networksViewModel,
  accountsViewModel,
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
        if (!accountsViewModel.asset) return null;
        return <AccountSelection {...accountsViewModel} />;
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
