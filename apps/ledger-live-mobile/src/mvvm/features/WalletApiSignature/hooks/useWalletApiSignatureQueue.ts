import { useCallback, useRef, useState } from "react";
import { SignatureRequestCancelled } from "@features/platform-wallet-api-signature-cancel";
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
  const [queue, setQueueState] = useState<readonly WalletApiSignatureQueueItem[]>([]);
  // Read by `cancelSignatures`, which rejects requests outside of a state update.
  const queueRef = useRef<readonly WalletApiSignatureQueueItem[]>([]);
  // A transaction is enqueued only once prepared, so one cancelled meanwhile is rejected here.
  const cancelledGroupIdsRef = useRef(new Set<string>());

  const setQueue = useCallback(
    (
      update: (
        items: readonly WalletApiSignatureQueueItem[],
      ) => readonly WalletApiSignatureQueueItem[],
    ) => {
      queueRef.current = update(queueRef.current);
      setQueueState(queueRef.current);
    },
    [],
  );

  const rejectIfCancelled = useCallback(
    (request: Pick<WalletApiDeviceIntentSignRequest, "requestGroupId" | "onError">): boolean => {
      const { requestGroupId } = request;
      if (requestGroupId === undefined || !cancelledGroupIdsRef.current.has(requestGroupId)) {
        return false;
      }
      request.onError(new SignatureRequestCancelled());
      return true;
    },
    [],
  );

  const enqueueTransactionSignature = useCallback(
    (request: WalletApiDeviceIntentSignRequest) => {
      if (rejectIfCancelled(request)) return;
      const id = nextIdRef.current++;
      setQueue(items => [...items, { id, type: "transaction", request }]);
    },
    [rejectIfCancelled, setQueue],
  );

  const enqueueMessageSignature = useCallback(
    (request: WalletApiDeviceIntentSignMessageRequest) => {
      if (rejectIfCancelled(request)) return;
      const id = nextIdRef.current++;
      setQueue(items => [...items, { id, type: "message", request }]);
    },
    [rejectIfCancelled, setQueue],
  );

  const currentSignature = queue[0] ?? null;
  const currentSignatureId = currentSignature?.id;

  // Bound to the shown request, so a late close of a settled request never drops the next one.
  const closeCurrentSignature = useCallback(() => {
    setQueue(items => items.filter(item => item.id !== currentSignatureId));
  }, [currentSignatureId, setQueue]);

  // The closed bridge session already rejects the promises of the dropped requests, and its
  // cancelled groups must not reject the requests of the next session reusing a group id.
  const clearSignatures = useCallback(() => {
    cancelledGroupIdsRef.current.clear();
    setQueue(() => []);
  }, [setQueue]);

  // The live app cancels the requests of a group, e.g. a dApp that disconnected: the shown one
  // closes its drawer, which stops the device job, and the queued ones never open. The group
  // stays cancelled, so a request still preparing is rejected when it arrives (not counted).
  const cancelSignatures = useCallback(
    (requestGroupId: string): number => {
      cancelledGroupIdsRef.current.add(requestGroupId);
      const cancelled = queueRef.current.filter(
        item => item.request.requestGroupId === requestGroupId,
      );
      if (cancelled.length === 0) return 0;
      setQueue(items => items.filter(item => !cancelled.includes(item)));
      for (const { request } of cancelled) {
        request.onError(new SignatureRequestCancelled());
      }
      return cancelled.length;
    },
    [setQueue],
  );

  return {
    currentSignature,
    enqueueTransactionSignature,
    enqueueMessageSignature,
    closeCurrentSignature,
    clearSignatures,
    cancelSignatures,
  };
}
