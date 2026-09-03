import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  RecipientInputMethod,
  RecipientResultType,
  RecipientType,
} from "../utils/contactTracking";

type SendFlowTrackingState = Readonly<{
  inputMethod: RecipientInputMethod;
  resultType: RecipientResultType | null;
  recipientType: RecipientType | null;
  savedContactDuringFlow: boolean;
}>;

type SendFlowTrackingContextValue = SendFlowTrackingState &
  Readonly<{
    setInputMethod: (inputMethod: RecipientInputMethod) => void;
    setRecipientResolution: (resultType: RecipientResultType, recipientType: RecipientType) => void;
    markContactSaved: () => void;
  }>;

const SendFlowTrackingContext = createContext<SendFlowTrackingContextValue | null>(null);

export function SendFlowTrackingProvider({ children }: Readonly<{ children: ReactNode }>) {
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

  const value = useMemo(
    () => ({
      ...state,
      setInputMethod,
      setRecipientResolution,
      markContactSaved,
    }),
    [markContactSaved, setInputMethod, setRecipientResolution, state],
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
