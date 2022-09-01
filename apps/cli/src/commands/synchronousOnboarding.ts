import {
  getOnboardingStatePolling,
  OnboardingStatePollingResult,
<<<<<<< HEAD
} from "@ledgerhq/live-common/hw/getOnboardingStatePolling";
=======
} from "@ledgerhq/live-common/lib/hw/getOnboardingStatePolling";
>>>>>>> 3f5518e1c9 (feat(llc): getOnboardingStatePolling logic)
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
