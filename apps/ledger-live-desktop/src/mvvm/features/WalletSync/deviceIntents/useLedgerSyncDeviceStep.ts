import { useCallback, useMemo, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { Step, walletSyncStepSelector } from "~/renderer/reducers/walletSync";

const DEVICE_STEPS: ReadonlySet<Step> = new Set([Step.DeviceAction, Step.DeviceActionInstance]);

/**
 * The state of the DIE device step for the Wallet Sync drawer: the run happens outside the side
 * panel, and its failure comes back inside it with a Retry.
 */
export function useLedgerSyncDeviceStep(isDrawerOpen: boolean) {
  const ledgerSyncDie = useFeature("lwdLedgerSyncDie");
  const step = useSelector(walletSyncStepSelector);
  const [error, setError] = useState<Error | null>(null);
  const isAtDeviceStep = isDrawerOpen && Boolean(ledgerSyncDie?.enabled) && DEVICE_STEPS.has(step);

  // A failure belongs to one visit of the device step: leaving the step or the drawer drops it.
  const [wasAtDeviceStep, setWasAtDeviceStep] = useState(isAtDeviceStep);
  if (wasAtDeviceStep !== isAtDeviceStep) {
    setWasAtDeviceStep(isAtDeviceStep);
    if (!isAtDeviceStep) setError(null);
  }

  const onRetry = useCallback(() => setError(null), []);
  const errorContext = useMemo(() => ({ error, onRetry }), [error, onRetry]);

  return {
    step,
    runsOnDevice: isAtDeviceStep && !error,
    onError: setError,
    errorContext,
  };
}
