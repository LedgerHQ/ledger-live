import { useState, useEffect, useCallback } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { hasSeenAnalyticsOptInPromptSelector } from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "react-redux";
import { setHasSeenAnalyticsOptInPrompt } from "~/renderer/actions/settings";
import { EntryPoint } from "../types/AnalyticsOptInromptNavigator";

type Props = {
  entryPoint: EntryPoint;
  callBack?: () => void;
};

export const useAnalyticsOptInPrompt = ({ entryPoint, callBack }: Props) => {
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const lldAnalyticsOptInPromptFlag = useFeature("lldAnalyticsOptInPrompt");

  const dispatch = useDispatch();

  const [isAnalitycsOptInPromptOpened, setIsAnalitycsOptInPromptOpened] = useState<boolean>(false);
  const [isFeatureFlagsAnalyticsPrefDisplayed, setIsFeatureFlagsAnalyticsPrefDisplayed] =
    useState<boolean>(false);

  const openAnalitycsOptInPrompt = useCallback(() => setIsAnalitycsOptInPromptOpened(true), []);

  useEffect(() => {
    const isFlagEnabled = lldAnalyticsOptInPromptFlag?.enabled && !hasSeenAnalyticsOptInPrompt;
    setIsFeatureFlagsAnalyticsPrefDisplayed(isFlagEnabled || false);
  }, [lldAnalyticsOptInPromptFlag, hasSeenAnalyticsOptInPrompt, entryPoint]);

  const onSubmit = useCallback(() => {
    setIsAnalitycsOptInPromptOpened(false);
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    if (entryPoint === "Onboarding") callBack?.();
  }, [dispatch, entryPoint, callBack]);

  const analyticsOptInPromptProps = {
    onClose: () => setIsAnalitycsOptInPromptOpened(false),
    isOpened: isAnalitycsOptInPromptOpened,
    entryPoint: entryPoint,
    variant: lldAnalyticsOptInPromptFlag?.params?.variant,
  };

  return {
    openAnalitycsOptInPrompt,
    setIsAnalitycsOptInPromptOpened,
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
    lldAnalyticsOptInPromptFlag,
    onSubmit,
  };
};
