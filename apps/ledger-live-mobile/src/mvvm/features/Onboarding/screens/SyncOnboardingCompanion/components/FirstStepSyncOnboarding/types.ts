import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SeedOriginType } from "@ledgerhq/types-live";
import type { RefObject } from "react";
import type { ScrollView } from "react-native";
import type { SyncOnboardingScreenProps } from "~/screens/SyncOnboarding/SyncOnboardingScreenProps";
import type { SEED_STATE } from "~/screens/SyncOnboarding/TwoStepStepper/types";

export type FirstStepSyncOnboardingProps = {
  analyticsSeedConfiguration: RefObject<SeedOriginType | undefined>;
  device: Device;
  handleFinishStep: (nextStep: SEED_STATE) => void;
  handlePollingError: (error: Error | null) => void;
  handleSeedGenerationDelay: () => void;
  isPollingOn: boolean;
  navigation: SyncOnboardingScreenProps["navigation"];
  notifyEarlySecurityCheckShouldReset: () => void;
  onLostDevice: () => void;
  parentRef: null | RefObject<ScrollView | null>;
  productName: string;
  setIsPollingOn: (isPolling: boolean) => void;
};

export type SeedPathStatus =
  | "backup_charon"
  | "choice_new_or_restore"
  | "choice_restore_direct_or_recover"
  | "new_seed"
  | "recover_seed"
  | "restore_charon"
  | "restore_seed";

export type UseFirstStepSyncOnboardingViewModelProps = FirstStepSyncOnboardingProps;
