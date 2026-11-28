import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import {
  overrideAccountAnalyticsIntroductionEligibility,
  resetAccountAnalyticsIntroduction,
  selectAccountAnalyticsIntroductionDismissed,
  selectAccountAnalyticsIntroductionEligibility,
} from "@features/flow-account-detail-analytics-notice/state";

type AccountDetailToolProps = Extract<DevToolsConfig[number], { id: "account-detail" }>["config"];

/** Requires the host to mount the notice slice at `accountAnalyticsIntroduction` (desktop and mobile do). */
export function useAccountDetailToolProps(): AccountDetailToolProps {
  const dispatch = useDispatch();
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const isEligible = useSelector(selectAccountAnalyticsIntroductionEligibility);
  const onReset = useCallback(() => {
    dispatch(resetAccountAnalyticsIntroduction());
  }, [dispatch]);
  const onEligibilityChange = useCallback(
    (value: boolean | null) => {
      dispatch(overrideAccountAnalyticsIntroductionEligibility(value));
    },
    [dispatch],
  );

  return useMemo(
    () => ({ analyticsIntroduction: { hasDismissed, isEligible, onReset, onEligibilityChange } }),
    [hasDismissed, isEligible, onReset, onEligibilityChange],
  );
}
