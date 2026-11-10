import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import {
  accountAnalyticsIntroductionPersistedSelector,
  resetAccountAnalyticsIntroduction,
  selectAccountAnalyticsIntroductionDismissed,
} from "@features/flow-account-detail-analytics-notice/state";

type AccountDetailToolProps = Extract<DevToolsConfig[number], { id: "account-detail" }>["config"];

const selectEligibility = (
  state: Parameters<typeof accountAnalyticsIntroductionPersistedSelector>[0],
): boolean | null => accountAnalyticsIntroductionPersistedSelector(state).isEligible;

/** Requires the host to mount the notice slice at `accountAnalyticsIntroduction` (desktop and mobile do). */
export function useAccountDetailToolProps(): AccountDetailToolProps {
  const dispatch = useDispatch();
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const isEligible = useSelector(selectEligibility);
  const onReset = useCallback(() => {
    dispatch(resetAccountAnalyticsIntroduction());
  }, [dispatch]);

  return useMemo(
    () => ({ analyticsIntroduction: { hasDismissed, isEligible, onReset } }),
    [hasDismissed, isEligible, onReset],
  );
}
