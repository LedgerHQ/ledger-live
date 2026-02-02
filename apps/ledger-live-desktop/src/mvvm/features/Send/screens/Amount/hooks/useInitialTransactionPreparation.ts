import { useRef } from "react";

export function useInitialTransactionPreparation(params: {
  shouldPrepare: boolean;
  mainAccountId: string;
  recipientAddress: string;
  bridgePending: boolean;
  updateTransactionWithPatch: (patch: Record<string, unknown>) => void;
}): void {
  // Trigger initial transaction preparation to fetch fee estimates (networkInfo for Bitcoin).
  // Scheduled as a microtask to avoid render-phase side effects while maintaining deterministic order.
  const lastPreparedKeyRef = useRef<string | null>(null);
  const prepareKey = params.shouldPrepare
    ? `${params.mainAccountId}-${params.recipientAddress}`
    : null;

  if (
    prepareKey &&
    lastPreparedKeyRef.current !== prepareKey &&
    !params.bridgePending &&
    params.recipientAddress
  ) {
    lastPreparedKeyRef.current = prepareKey;

    queueMicrotask(() => {
      params.updateTransactionWithPatch({});
    });
  }
}
