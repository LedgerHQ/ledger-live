import React from "react";
import Animated from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { ModularDrawerStep } from "../types";
import AssetSelection from "../screens/AssetSelection";
import NetworkSelection from "../screens/NetworkSelection";
import AccountSelection from "../screens/AccountSelection";
import { ModularDrawerFlowProps } from ".";
import useScreenTransition from "./useScreenTransition";
import { useSelector } from "~/context/hooks";
import { modularDrawerStepSelector } from "~/reducers/modularDrawer";

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [ModularDrawerStep.Asset]: "modularDrawer.selectAsset",
  [ModularDrawerStep.Network]: "modularDrawer.selectNetwork",
  [ModularDrawerStep.Account]: "modularDrawer.selectAccount",
};

export function ModularDrawerFlowView({
  assetsViewModel,
  networksViewModel,
  accountsViewModel,
}: ModularDrawerFlowProps) {
  const { t } = useTranslation();
  const currentStep = useSelector(modularDrawerStepSelector);

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

  const renderAnimatedStep = (step: ModularDrawerStep) => {
    const stepAnimations = getStepAnimations(step);
    if (!stepAnimations) return null;

    return (
      <Animated.View
        key={`${step}`}
        style={[stepAnimations.animatedStyle]}
        testID={`${step}-screen`}
      >
        <BottomSheetHeader title={t(TranslationKeyMap[step])} spacing appearance="expanded" />
        <View style={{ flex: 1 }}>{renderStepContent(step)}</View>
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
