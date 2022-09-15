import {
  getOnboardingStatePolling,
  OnboardingStatePollingResult,
} from "@ledgerhq/live-common/hw/getOnboardingStatePolling";
import { Observable } from "rxjs";

import { deviceOpt } from "../scan";

export default {
  description: "track the onboarding status of your device",
  args: [
    {
      name: "pollingPeriodMs",
      alias: "p",
      desc: "polling period in milliseconds",
      type: Number,
    },
    deviceOpt,
  ],
  job: ({
    device,
    pollingPeriodMs,
  }: Partial<{
    device: string;
    pollingPeriodMs: number;
  }>): Observable<OnboardingStatePollingResult | null> =>
    getOnboardingStatePolling({
      deviceId: device ?? "",
      pollingPeriodMs: pollingPeriodMs ?? 1000,
    }),
};
