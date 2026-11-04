import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import {
  resetAccountAnalyticsIntroduction,
  selectAccountAnalyticsIntroductionDismissed,
} from "@features/flow-account-detail-analytics-notice/state";

type AccountDetailToolProps = Extract<DevToolsConfig[number], { id: "account-detail" }>["config"];

/** Requires the host to mount the notice slice at `accountAnalyticsIntroduction` (desktop does). */
export function useAccountDetailToolProps(): AccountDetailToolProps {
  const dispatch = useDispatch();
  const hasDismissed = useSelector(selectAccountAnalyticsIntroductionDismissed);
  const onReset = useCallback(() => {
    dispatch(resetAccountAnalyticsIntroduction());
  }, [dispatch]);

  return useMemo(
    () => ({ analyticsIntroduction: { hasDismissed, onReset } }),
    [hasDismissed, onReset],
  );
}
