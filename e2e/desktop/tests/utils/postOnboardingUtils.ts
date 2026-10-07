import type { Page } from "@playwright/test";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getFeatureFlags } from "tests/utils/featureFlagUtils";

/**
 * Actions the finish-onboarding dialog lists right after a fresh install sets a device up, in
 * display order. "Set up your Ledger" leads; Buy crypto is never listed in the dialog, and Recover
 * only is while a subscription is in progress. Flag-gated actions follow the running app's flags,
 * so the expectation holds whatever the testing or production Firebase serves.
 */
export async function expectedFinishOnboardingActions(
  page: Page,
  device: DeviceModelId,
): Promise<string[]> {
  if (device === DeviceModelId.nanoS) {
    return ["deviceOnboarded", "assetsTransfer"];
  }

  const { lldLedgerSyncEntryPoints, lwdProductTour } = await getFeatureFlags(page);
  return [
    "deviceOnboarded",
    "assetsTransfer",
    ...(lldLedgerSyncEntryPoints?.enabled && lldLedgerSyncEntryPoints.params?.postOnboarding
      ? ["syncAccounts"]
      : []),
    ...(lwdProductTour?.enabled ? ["discoverWallet"] : []),
  ];
}
