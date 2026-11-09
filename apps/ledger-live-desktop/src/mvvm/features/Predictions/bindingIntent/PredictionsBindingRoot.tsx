import React, { useCallback, useEffect, useRef, useState } from "react";
import { predictionsBindingRequests, type PredictionsBindingRequest } from "./bindingRequests";
import { PredictionsBindingExecutorLWD } from "./PredictionsBindingExecutorLWD";

type OpenRequest = {
  id: number;
  request: PredictionsBindingRequest;
  // Scoped to this request, so a replaced executor's late callback can't close its replacement.
  onDone: () => void;
};

export default function PredictionsBindingRoot() {
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const openRequestRef = useRef<OpenRequest | null>(null);

  const show = useCallback((request: OpenRequest | null) => {
    openRequestRef.current = request;
    setOpenRequest(request);
  }, []);

  useEffect(() => {
    let lastId = 0;
    const close = (id: number) => {
      if (openRequestRef.current?.id === id) show(null);
    };
    // A replaced or abandoned request is cancelled, so whoever waits for it can go on.
    const cancelOpenRequest = () => openRequestRef.current?.request.onCancel();
    const open = (request: PredictionsBindingRequest) => {
      cancelOpenRequest();
      lastId += 1;
      const id = lastId;
      show({ id, request, onDone: () => close(id) });
    };
    const cancel = (request: PredictionsBindingRequest) => {
      const current = openRequestRef.current;
      if (current?.request !== request) return;
      request.onCancel();
      close(current.id);
    };
    const unregister = predictionsBindingRequests.register({ open, cancel });
    return () => {
      unregister();
      cancelOpenRequest();
      openRequestRef.current = null;
    };
  }, [show]);

  if (!openRequest) return null;
  // A new request starts over from the device connection.
  return (
    <PredictionsBindingExecutorLWD
      key={openRequest.id}
      {...openRequest.request}
      onDone={openRequest.onDone}
    />
  );
}
