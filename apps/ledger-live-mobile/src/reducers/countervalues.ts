import {
  countervaluesPollingIsPollingSelector,
  countervaluesPollingTriggerLoadSelector,
  countervaluesStateErrorSelector,
  countervaluesStatePendingSelector,
  countervaluesStateSelector,
} from "@features/platform-market-countervalues";
import { useSelector } from "~/context/hooks";

export const useCountervaluesStateError = () => useSelector(countervaluesStateErrorSelector);
export const useCountervaluesStatePending = () => useSelector(countervaluesStatePendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector);

export const useCountervaluesPollingIsPolling = () =>
  useSelector(countervaluesPollingIsPollingSelector);
export const useCountervaluesPollingTriggerLoad = () =>
  useSelector(countervaluesPollingTriggerLoadSelector);
