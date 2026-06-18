import { useEffect, useState } from "react";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { ANALYTICS_OPT_IN_VARIANT } from "../types/variants";
import { track } from "~/renderer/analytics/segment";

interface UseDrawerLogicProps {
  entryPoint: EntryPoint;
  shouldWeTrack: boolean;
  onClose: () => void;
}

export const useDrawerLogic = ({ entryPoint, shouldWeTrack, onClose }: UseDrawerLogicProps) => {
  const [step, setStep] = useState<number>(0);
  const [preventClosable, setPreventClosable] = useState(false);

  const isNotOnBoarding = entryPoint !== EntryPoint.onboarding;

  const handleRequestBack = () => {
    setStep(prevState => prevState - 1);
    track(
      "button_clicked",
      { button: "back", entryPoint, variant: ANALYTICS_OPT_IN_VARIANT },
      shouldWeTrack,
    );
  };

  const handleRequestClose = () => {
    onClose();
    track(
      "button_clicked",
      { button: "close", entryPoint, variant: ANALYTICS_OPT_IN_VARIANT },
      shouldWeTrack,
    );
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
  };
};
