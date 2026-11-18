import { useState, useCallback, useEffect, useRef } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useOperationsCsvExporter } from "~/renderer/hooks/useOperationsCsvExporter";

type UseExportOperationsCsvArgs = {
  accounts: Account[];
  checkedIds: string[];
  onSuccess?: () => void;
  onError?: () => void;
};

export function useExportOperationsCsv({
  accounts,
  checkedIds,
  onSuccess,
  onError,
}: UseExportOperationsCsvArgs) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const { syncAccounts, isSyncing, exportCsv: exportAccountsCsv } = useOperationsCsvExporter();

  const hasScheduledSync = useRef(false);
  useEffect(() => {
    if (accounts.length === 0 || hasScheduledSync.current) return;
    hasScheduledSync.current = true;
    syncAccounts(accounts.map(a => a.id));
  }, [accounts, syncAccounts]);

  const selectedAccounts = accounts.filter(a => checkedIds.includes(a.id));
  const isLoading =
    selectedAccounts.length > 0 && hasScheduledSync.current && isSyncing(selectedAccounts);

  const exportCsv = useCallback(async () => {
    const outcome = await exportAccountsCsv(accounts.filter(a => checkedIds.includes(a.id)));
    if (outcome === "canceled") return;
    if (outcome === "saved") {
      setSuccess(true);
      onSuccess?.();
    } else {
      setError(true);
      onError?.();
    }
  }, [accounts, checkedIds, exportAccountsCsv, onError, onSuccess]);

  const resetState = useCallback(() => {
    setSuccess(false);
    setError(false);
    hasScheduledSync.current = false;
  }, []);

  return { success, error, isLoading, exportCsv, resetState };
}
