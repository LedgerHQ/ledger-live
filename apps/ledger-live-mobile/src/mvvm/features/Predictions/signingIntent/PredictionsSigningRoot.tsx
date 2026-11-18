import React, { useCallback, useEffect, useRef, useState } from "react";
import { predictionsSigningRequests, type PredictionsSigningRequest } from "./signingRequests";
import { PredictionsSigningExecutorLWM } from "./PredictionsSigningExecutorLWM";

type OpenRequest = {
  id: number;
  request: PredictionsSigningRequest;
  isClosing: boolean;
  // Scoped to this request, so a replaced executor's late callbacks can't close its replacement.
  onDone: () => void;
  onDismissed: () => void;
};

export default function PredictionsSigningRoot() {
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const openRequestRef = useRef<OpenRequest | null>(null);

  const show = useCallback((request: OpenRequest | null) => {
    openRequestRef.current = request;
    setOpenRequest(request);
  }, []);

  useEffect(() => {
    let lastId = 0;
    // The sheet animates out before it unmounts; the setup sheet queued behind it opens after.
    const requestClose = (id: number) => {
      const current = openRequestRef.current;
      if (current?.id === id) show({ ...current, isClosing: true });
    };
    const remove = (id: number) => {
      if (openRequestRef.current?.id === id) show(null);
    };
    // A replaced or abandoned request is cancelled, so whoever waits for it can go on.
    const cancelOpenRequest = () => openRequestRef.current?.request.onCancel();
    const open = (request: PredictionsSigningRequest) => {
      cancelOpenRequest();
      lastId += 1;
      const id = lastId;
      show({
        id,
        request,
        isClosing: false,
        onDone: () => requestClose(id),
        onDismissed: () => remove(id),
      });
    };
    const cancel = (request: PredictionsSigningRequest) => {
      const current = openRequestRef.current;
      if (current?.request !== request) return;
      request.onCancel();
      requestClose(current.id);
    };
    const unregister = predictionsSigningRequests.register({ open, cancel });
    return () => {
      unregister();
      cancelOpenRequest();
      openRequestRef.current = null;
    };
  }, [show]);

  if (!openRequest) return null;
  // A new request starts over from the device connection.
  return (
    <PredictionsSigningExecutorLWM
      key={openRequest.id}
      {...openRequest.request}
      isOpen={!openRequest.isClosing}
      onDone={openRequest.onDone}
      onDismissed={openRequest.onDismissed}
    />
  );
}
