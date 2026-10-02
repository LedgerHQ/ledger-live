import { useEffect, useRef } from "react";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import {
  type SendFlowMessageTrackingRequest,
  useSendFlowTracking,
} from "../context/SendFlowTrackingContext";

type UseSendFlowMessageTrackingParams = Readonly<{
  step: SendFlowStep;
  request: SendFlowMessageTrackingRequest | null;
  debounceKey?: string;
  isTransient?: boolean;
  immediate?: boolean;
}>;

export function useSendFlowMessageTracking({
  step,
  request,
  debounceKey,
  isTransient = false,
  immediate = false,
}: UseSendFlowMessageTrackingParams): void {
  const { clearPendingMessage, scheduleMessage, trackMessage } = useSendFlowTracking();
  const requestRef = useRef(request);
  requestRef.current = request;
  const requestKey = request
    ? (debounceKey ?? JSON.stringify({ message: request.message, metadata: request.metadata }))
    : null;

  useEffect(() => {
    const currentRequest = requestRef.current;
    if (!currentRequest || isTransient) {
      clearPendingMessage(step);
      return;
    }

    if (immediate) {
      trackMessage(currentRequest);
      return;
    }

    scheduleMessage(currentRequest);
    return () => clearPendingMessage(step);
  }, [
    clearPendingMessage,
    immediate,
    isTransient,
    requestKey,
    scheduleMessage,
    step,
    trackMessage,
  ]);
}
