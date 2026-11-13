import React, { createContext, useContext } from "react";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";

type LedgerSyncDeviceStepErrorValue = Readonly<{
  error: Error | null;
  onRetry: () => void;
}>;

/** The failure of the last DIE device step run, owned by the Wallet Sync drawer. */
export const LedgerSyncDeviceStepErrorContext =
  createContext<LedgerSyncDeviceStepErrorValue | null>(null);

function useLedgerSyncDeviceStepError(): LedgerSyncDeviceStepErrorValue {
  const value = useContext(LedgerSyncDeviceStepErrorContext);
  if (!value) {
    throw new Error("LedgerSyncDeviceStepError must render inside the Wallet Sync drawer");
  }
  return value;
}

/**
 * The DIE device step as the side panel shows it: the failure of the last run with a Retry, or
 * nothing while the run happens outside the panel.
 */
export function LedgerSyncDeviceStepError() {
  const { error, onRetry } = useLedgerSyncDeviceStepError();
  if (!error) return null;
  return <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />;
}
