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
import { Keyboard } from "react-native";
import { v4 as uuid } from "uuid";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { track } from "~/analytics";
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
    resetRecipientResolution: () => void;
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
  const pendingMessagesRef = useRef(
    new Map<
      SendFlowStep,
      {
        request: SendFlowMessageTrackingRequest;
        timeout: ReturnType<typeof setTimeout>;
      }
    >(),
  );
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

  const resetRecipientResolution = useCallback(() => {
    setState(previous =>
      previous.resultType === null && previous.recipientType === null
        ? previous
        : { ...previous, resultType: null, recipientType: null },
    );
  }, []);

  const markContactSaved = useCallback(() => {
    setState(previous => ({ ...previous, savedContactDuringFlow: true }));
  }, []);

  const clearPendingMessage = useCallback((step: SendFlowStep) => {
    const pending = pendingMessagesRef.current.get(step);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingMessagesRef.current.delete(step);
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
      clearPendingMessage(request.step);

      const timeout = setTimeout(() => {
        pendingMessagesRef.current.delete(request.step);
        trackMessage(request);
      }, 500);

      pendingMessagesRef.current.set(request.step, { request, timeout });
    },
    [clearPendingMessage, trackMessage],
  );

  const flushMessage = useCallback(
    (step: SendFlowStep) => {
      const pending = pendingMessagesRef.current.get(step);
      if (!pending) return;
      clearPendingMessage(step);
      trackMessage(pending.request);
    },
    [clearPendingMessage, trackMessage],
  );

  const endSession = useCallback(() => {
    pendingMessagesRef.current.forEach(pending => {
      clearTimeout(pending.timeout);
    });
    pendingMessagesRef.current.clear();
    sessionEndedRef.current = true;
  }, []);

  useEffect(() => {
    sessionEndedRef.current = false;
    return () => {
      endSession();
    };
  }, [endSession]);

  // Dismissing the keyboard is the native equivalent of an input blur.
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      [...pendingMessagesRef.current.keys()].forEach(step => {
        flushMessage(step);
      });
    });
    return () => subscription.remove();
  }, [flushMessage]);

  const value = useMemo(
    () => ({
      ...state,
      flowSessionId,
      setInputMethod,
      setRecipientResolution,
      resetRecipientResolution,
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
      resetRecipientResolution,
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
