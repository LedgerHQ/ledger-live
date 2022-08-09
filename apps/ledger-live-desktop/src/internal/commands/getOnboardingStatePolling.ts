import {
  getOnboardingStatePolling,
  GetOnboardingStatePollingArgs,
  GetOnboardingStatePollingResult,
} from "@ledgerhq/live-common/lib/hw/getOnboardingStatePolling";

// Makes getOnboardingStatePolling run on the internal thread
const cmd = (args: GetOnboardingStatePollingArgs): GetOnboardingStatePollingResult =>
  getOnboardingStatePolling(args);

export default cmd;
