import { useCallback, useRef, useState } from "react";
import type { WalletApiSignatureQueueItem } from "./types";

export type UseWalletApiSignatureQueueResult<TransactionRequest, MessageRequest> = Readonly<{
  currentSignature: WalletApiSignatureQueueItem<TransactionRequest, MessageRequest> | null;
  enqueueTransactionSignature: (request: TransactionRequest) => void;
  enqueueMessageSignature: (request: MessageRequest) => void;
  closeCurrentSignature: () => void;
  clearSignatures: () => void;
}>;

/**
 * The Wallet API sign requests waiting for the device, first in first out. Only the first one
 * is shown, so a request sent while another is signing (e.g. a dApp over Wallet Connect)
 * waits its turn instead of replacing it or driving the device at the same time.
 */
export function useWalletApiSignatureQueue<
  TransactionRequest,
  MessageRequest,
>(): UseWalletApiSignatureQueueResult<TransactionRequest, MessageRequest> {
  const nextIdRef = useRef(0);
  const [queue, setQueue] = useState<
    readonly WalletApiSignatureQueueItem<TransactionRequest, MessageRequest>[]
  >([]);

  const enqueueTransactionSignature = useCallback((request: TransactionRequest) => {
    const id = nextIdRef.current++;
    setQueue(items => [...items, { id, type: "transaction", request }]);
  }, []);

  const enqueueMessageSignature = useCallback((request: MessageRequest) => {
    const id = nextIdRef.current++;
    setQueue(items => [...items, { id, type: "message", request }]);
  }, []);

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
