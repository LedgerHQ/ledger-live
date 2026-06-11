import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";
import type { SeedPathStatus } from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/FirstStepSyncOnboarding/types";

export type SeedCompanionStepProps = {
  seedPathStatus: SeedPathStatus;
  charonSupported?: OnboardingState["charonSupported"];
  charonStatus?: OnboardingState["charonStatus"];
  productName: string;
  device: Device;
};
