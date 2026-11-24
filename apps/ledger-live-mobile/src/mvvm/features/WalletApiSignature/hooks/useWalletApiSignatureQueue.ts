import { useCallback, useRef, useState } from "react";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer/types";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer/types";

export type WalletApiSignatureQueueItem =
  | Readonly<{ id: number; type: "transaction"; request: WalletApiDeviceIntentSignRequest }>
  | Readonly<{ id: number; type: "message"; request: WalletApiDeviceIntentSignMessageRequest }>;

/**
 * The Wallet API sign requests waiting for the device, first in first out. Only the first one
 * is shown, so a request sent while another is signing (e.g. a dApp over Wallet Connect)
 * waits its turn instead of replacing it and leaving its promise pending forever.
 */
export function useWalletApiSignatureQueue() {
  const nextIdRef = useRef(0);
  const [queue, setQueue] = useState<readonly WalletApiSignatureQueueItem[]>([]);

  const enqueueTransactionSignature = useCallback((request: WalletApiDeviceIntentSignRequest) => {
    const id = nextIdRef.current++;
    setQueue(items => [...items, { id, type: "transaction", request }]);
  }, []);

  const enqueueMessageSignature = useCallback(
    (request: WalletApiDeviceIntentSignMessageRequest) => {
      const id = nextIdRef.current++;
      setQueue(items => [...items, { id, type: "message", request }]);
    },
    [],
  );

  const currentSignature = queue[0] ?? null;
  const currentSignatureId = currentSignature?.id;

  // Bound to the shown request, so a late close of a settled request never drops the next one.
  const closeCurrentSignature = useCallback(() => {
    setQueue(items => items.filter(item => item.id !== currentSignatureId));
  }, [currentSignatureId]);

  // The closed bridge session already rejects the promises of the dropped requests.
  const clearSignatures = useCallback(() => setQueue([]), []);

  return {
    currentSignature,
    enqueueTransactionSignature,
    enqueueMessageSignature,
    closeCurrentSignature,
    clearSignatures,
  };
}
