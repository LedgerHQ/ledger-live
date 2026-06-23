import { useEffect, useState } from "react";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { track } from "~/renderer/analytics/segment";
import { useAnalyticsOptInPrompt } from "./useCommonLogic";

interface UseDrawerLogicProps {
  entryPoint: EntryPoint;
  onClose: () => void;
}

export const useDrawerLogic = ({ entryPoint, onClose }: UseDrawerLogicProps) => {
  const [step, setStep] = useState<number>(0);
  const [preventClosable, setPreventClosable] = useState(false);

  const isNotOnBoarding = entryPoint !== EntryPoint.onboarding;

  const { shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint });

  const handleRequestBack = () => {
    setStep(prevState => prevState - 1);
    track("button_clicked", { button: "back", entryPoint }, shouldWeTrack);
  };

  const handleRequestClose = () => {
    onClose();
    track("button_clicked", { button: "close", entryPoint }, shouldWeTrack);
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
