import React from "react";
import Animated from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { ModularDrawerStep } from "../types";
import { Title } from "../components/Title";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import AccountSelection from "../screens/AccountSelection";
import { ModularDrawerFlowProps } from ".";
import useScreenTransition from "./useScreenTransition";
import { useSelector } from "~/context/hooks";
import { modularDrawerStepSelector } from "~/reducers/modularDrawer";
//import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export function ModularDrawerFlowView({
  assetsViewModel,
  networksViewModel,
  accountsViewModel,
}: ModularDrawerFlowProps) {
  const currentStep = useSelector(modularDrawerStepSelector);
  // TODO: Re-enable it for LIVE-27294:
  // const { isEnabled } = useWalletFeaturesConfig("mobile");

  const { activeSteps, getStepAnimations } = useScreenTransition(currentStep);

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case ModularDrawerStep.Asset:
        return <AssetSelection {...assetsViewModel} useLumenBottomSheet={false} />;
      case ModularDrawerStep.Network:
        return <NetworkSelection {...networksViewModel} useLumenBottomSheet={false} />;
      case ModularDrawerStep.Account:
        return <AccountSelection {...accountsViewModel} useLumenBottomSheet={false} />;
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
        {/* TODO: Re-enable it for LIVE-27294: {!isEnabled && <Title step={step} />} */}
        <Title step={step} />
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
