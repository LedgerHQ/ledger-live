import type { RestoreBackupDAIntermediateValue } from "@ledgerhq/dmk-ledger-wallet";
import {
  RESTORE_APPS_WEIGHT,
  RESTORE_CLS_WEIGHT,
  RESTORE_LANGUAGE_WEIGHT,
  RestoreBackupStepValue,
} from "../constants";

/** Apps and app storage share one term, one half each, since they restore the same apps. */
const APPS_HALF_WEIGHT = RESTORE_APPS_WEIGHT / 2;

const PHASES: ReadonlyArray<{ step: string; start: number; weight: number }> = [
  {
    step: RestoreBackupStepValue.InstallLanguagePackage,
    start: 0,
    weight: RESTORE_LANGUAGE_WEIGHT,
  },
  {
    step: RestoreBackupStepValue.InstallOrUpdateApps,
    start: RESTORE_LANGUAGE_WEIGHT,
    weight: APPS_HALF_WEIGHT,
  },
  {
    step: RestoreBackupStepValue.RestoreAppsStorage,
    start: RESTORE_LANGUAGE_WEIGHT + APPS_HALF_WEIGHT,
    weight: APPS_HALF_WEIGHT,
  },
  {
    step: RestoreBackupStepValue.UploadCustomLockScreen,
    start: 1 - RESTORE_CLS_WEIGHT,
    weight: RESTORE_CLS_WEIGHT,
  },
];

/**
 * The restore reports which of its phases it is in, and sometimes how far into it. Its steps ship
 * as a type-only export, hence the comparison against the raw values.
 */
export const restoreProgress = (
  intermediateValue: RestoreBackupDAIntermediateValue | null | undefined,
): number => {
  if (!intermediateValue) {
    return 0;
  }

  const step: string = intermediateValue.step;
  const phase = PHASES.find(candidate => candidate.step === step);
  if (!phase) {
    // Everything before the first phase: dashboard checks and the consent request.
    return 0;
  }

  return phase.start + phase.weight * (intermediateValue.progress ?? 0);
};
