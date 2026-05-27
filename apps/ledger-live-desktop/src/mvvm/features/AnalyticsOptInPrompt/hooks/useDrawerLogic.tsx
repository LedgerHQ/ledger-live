import { useEffect, useState } from "react";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { AB_TESTING_VARIANTS, type ABTestingVariants } from "../types/variants";
import { track } from "~/renderer/analytics/segment";
import { getVariant, useAnalyticsOptInPrompt } from "./useCommonLogic";

interface UseDrawerLogicProps {
  entryPoint: EntryPoint;
  variant: ABTestingVariants;
  onClose: () => void;
}

export const useDrawerLogic = ({ entryPoint, variant, onClose }: UseDrawerLogicProps) => {
  const [step, setStep] = useState<number>(0);
  const [preventClosable, setPreventClosable] = useState(false);

  const isNotOnBoarding = entryPoint !== EntryPoint.onboarding;
  const isVariantB = getVariant(variant) === AB_TESTING_VARIANTS.B;

  const { shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint });

  const handleRequestBack = () => {
    setStep(prevState => prevState - 1);
    track("button_clicked", { button: "back", entryPoint, variant }, shouldWeTrack);
  };

  const handleRequestClose = () => {
    onClose();
    track("button_clicked", { button: "close", entryPoint, variant }, shouldWeTrack);
  };

  useEffect(() => {
    if (isNotOnBoarding) setPreventClosable(true);
  }, [isNotOnBoarding]);

  return {
    step,
    setStep,
    handleRequestBack,
    handleRequestClose,
    preventClosable,
    isVariantB,
  };
};
