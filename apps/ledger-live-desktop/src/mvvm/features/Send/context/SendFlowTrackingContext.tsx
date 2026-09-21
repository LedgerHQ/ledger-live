import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { track } from "~/renderer/analytics/segment";
import type {
  RecipientInputMethod,
  RecipientResultType,
  RecipientType,
} from "../utils/contactTracking";
import {
  getSendFlowErrorTrackingProperties,
  type SendFlowMessageMetadata,
  type SendFlowTrackedMessage,
} from "../utils/tracking";

export type SendFlowMessageTrackingRequest = Readonly<{
  account: AccountLike | null;
  parentAccount?: Account | null;
  step: SendFlowStep;
  message: SendFlowTrackedMessage;
  metadata?: SendFlowMessageMetadata;
}>;

type SendFlowTrackingState = Readonly<{
  inputMethod: RecipientInputMethod;
  resultType: RecipientResultType | null;
  recipientType: RecipientType | null;
  savedContactDuringFlow: boolean;
}>;

type SendFlowTrackingContextValue = SendFlowTrackingState &
  Readonly<{
    flowSessionId: string;
    setInputMethod: (inputMethod: RecipientInputMethod) => void;
    setRecipientResolution: (resultType: RecipientResultType, recipientType: RecipientType) => void;
    markContactSaved: () => void;
    trackMessage: (request: SendFlowMessageTrackingRequest) => void;
    scheduleMessage: (request: SendFlowMessageTrackingRequest) => void;
    flushMessage: (step: SendFlowStep) => void;
    clearPendingMessage: (step: SendFlowStep) => void;
    endSession: () => void;
  }>;

const SendFlowTrackingContext = createContext<SendFlowTrackingContextValue | null>(null);

export function SendFlowTrackingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [flowSessionId] = useState(uuid);
  const trackedMessagesRef = useRef(new Set<string>());
  const sessionEndedRef = useRef(false);
  const pendingMessageRef = useRef<{
    request: SendFlowMessageTrackingRequest;
    timeout: ReturnType<typeof setTimeout>;
  } | null>(null);
  const [state, setState] = useState<SendFlowTrackingState>({
    inputMethod: "manual",
    resultType: null,
    recipientType: null,
    savedContactDuringFlow: false,
  });

  const setInputMethod = useCallback((inputMethod: RecipientInputMethod) => {
    setState(previous => ({ ...previous, inputMethod }));
  }, []);

  const setRecipientResolution = useCallback(
    (resultType: RecipientResultType, recipientType: RecipientType) => {
      setState(previous => ({ ...previous, resultType, recipientType }));
    },
    [],
  );

  const markContactSaved = useCallback(() => {
    setState(previous => ({ ...previous, savedContactDuringFlow: true }));
  }, []);

  const clearPendingMessage = useCallback((step: SendFlowStep) => {
    if (pendingMessageRef.current?.request.step !== step) return;
    clearTimeout(pendingMessageRef.current.timeout);
    pendingMessageRef.current = null;
  }, []);

  const trackMessage = useCallback(
    (request: SendFlowMessageTrackingRequest) => {
      if (sessionEndedRef.current) return;

      const deduplicationKey = `${request.step}:${request.message.messageId}`;
      if (trackedMessagesRef.current.has(deduplicationKey)) return;

      trackedMessagesRef.current.add(deduplicationKey);
      track(
        "error_displayed",
        getSendFlowErrorTrackingProperties({
          account: request.account,
          parentAccount: request.parentAccount,
          flowSessionId,
          step: request.step,
          message: request.message,
          metadata: request.metadata,
        }),
      );
    },
    [flowSessionId],
  );

  const scheduleMessage = useCallback(
    (request: SendFlowMessageTrackingRequest) => {
      if (pendingMessageRef.current) {
        clearTimeout(pendingMessageRef.current.timeout);
        pendingMessageRef.current = null;
      }

      const timeout = setTimeout(() => {
        pendingMessageRef.current = null;
        trackMessage(request);
      }, 500);

      pendingMessageRef.current = { request, timeout };
    },
    [trackMessage],
  );

  const flushMessage = useCallback(
    (step: SendFlowStep) => {
      if (pendingMessageRef.current?.request.step !== step) return;
      const request = pendingMessageRef.current.request;
      clearPendingMessage(step);
      trackMessage(request);
    },
    [clearPendingMessage, trackMessage],
  );

  const endSession = useCallback(() => {
    if (pendingMessageRef.current) {
      clearTimeout(pendingMessageRef.current.timeout);
      pendingMessageRef.current = null;
    }
    sessionEndedRef.current = true;
  }, []);

  useEffect(() => {
    sessionEndedRef.current = false;
    return () => {
      endSession();
    };
  }, [endSession]);

  useEffect(() => {
    const flushPendingMessage = () => {
      const step = pendingMessageRef.current?.request.step;
      if (step) flushMessage(step);
    };
    document.addEventListener("focusout", flushPendingMessage);
    return () => document.removeEventListener("focusout", flushPendingMessage);
  }, [flushMessage]);

  const value = useMemo(
    () => ({
      ...state,
      flowSessionId,
      setInputMethod,
      setRecipientResolution,
      markContactSaved,
      trackMessage,
      scheduleMessage,
      flushMessage,
      clearPendingMessage,
      endSession,
    }),
    [
      clearPendingMessage,
      endSession,
      flushMessage,
      flowSessionId,
      markContactSaved,
      scheduleMessage,
      setInputMethod,
      setRecipientResolution,
      state,
      trackMessage,
    ],
  );

  return (
    <SendFlowTrackingContext.Provider value={value}>{children}</SendFlowTrackingContext.Provider>
  );
}

export function useSendFlowTracking(): SendFlowTrackingContextValue {
  const context = useContext(SendFlowTrackingContext);
  if (!context) {
    throw new Error("useSendFlowTracking must be used within a SendFlowTrackingProvider");
  }
  return context;
}
