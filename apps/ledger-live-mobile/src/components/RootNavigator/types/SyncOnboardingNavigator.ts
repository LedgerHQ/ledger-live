import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";
import { CompanionStepKey } from "../../../screens/SyncOnboarding/types";

export type SyncOnboardingStackParamList = {
  [ScreenName.SyncOnboardingCompanion]: {
    device: Device;
    deviceJsonURIComponent?: string;
    initialStepKey?: CompanionStepKey;
  };
  [ScreenName.SyncOnboardingCompletion]: {
    device: Device;
  };
};
