import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SeedOriginType } from "@ledgerhq/types-live";
import type { CompanionStep } from "../../types";
import type { RefObject } from "react";

export type SecondStepSyncOnboardingProps = {
  device: Device;
  companionStep: CompanionStep;
  handleDone: (done: boolean) => void;
  analyticsSeedConfiguration: RefObject<SeedOriginType | undefined>;
};

export type UseSecondStepSyncOnboardingViewModelProps = Pick<
  SecondStepSyncOnboardingProps,
  "companionStep" | "handleDone" | "analyticsSeedConfiguration"
>;
