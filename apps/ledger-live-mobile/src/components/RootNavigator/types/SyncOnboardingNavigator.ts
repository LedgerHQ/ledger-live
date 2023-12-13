import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type SyncOnboardingStackParamList = {
  [ScreenName.SyncOnboardingCompanion]: {
    device: Device;
  };
  [ScreenName.SyncOnboardingCompletion]: {
    device: Device;
  };
};
