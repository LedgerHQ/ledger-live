import {
  countervaluesPollingIsPollingSelector,
  countervaluesPollingTriggerLoadSelector,
  countervaluesStateErrorSelector,
  countervaluesStatePendingSelector,
  countervaluesStateSelector,
  countervaluesUserSettingsSelector,
} from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";

export const useCountervaluesPollingIsPolling = () =>
  useSelector(countervaluesPollingIsPollingSelector);
export const useCountervaluesPollingTriggerLoad = () =>
  useSelector(countervaluesPollingTriggerLoadSelector);
export const useCountervaluesStateError = () => useSelector(countervaluesStateErrorSelector);
export const useCountervaluesStatePending = () => useSelector(countervaluesStatePendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector);
export const useCountervaluesUserSettings = () => useSelector(countervaluesUserSettingsSelector);
