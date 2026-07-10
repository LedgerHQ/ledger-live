import React, { useRef } from "react";
import { View } from "react-native";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { LargeScreenUpsellModalDrawer } from "../LargeScreenUpsellModalDrawer";

type LargeScreenUpsellModalPortfolioMountViewProps = Readonly<{
  isEligible: boolean;
  isOpen: boolean;
  onClose: () => void;
  featureIntroViewModel: FeatureIntroViewModel;
  bottomInset: number;
}>;

export function LargeScreenUpsellModalPortfolioMountView({
  isEligible,
  isOpen,
  onClose,
  featureIntroViewModel,
  bottomInset,
}: LargeScreenUpsellModalPortfolioMountViewProps) {
  const hasBeenEligibleRef = useRef(isEligible);
  if (isEligible) {
    hasBeenEligibleRef.current = true;
  }

  if (!hasBeenEligibleRef.current) {
    return null;
  }

  return (
    <View testID="large-screen-upsell-portfolio-mount" collapsable={false}>
      <LargeScreenUpsellModalDrawer
        isOpen={isOpen}
        onClose={onClose}
        featureIntroViewModel={featureIntroViewModel}
        bottomInset={bottomInset}
      />
    </View>
  );
}
