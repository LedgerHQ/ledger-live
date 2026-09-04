import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useSendFlowActions, useSendFlowData } from "./SendFlowContext";

type SendMemoResetContextValue = Readonly<{
  registerResetViewState: (resetViewState: () => void) => () => void;
  markMemoSkipped: () => void;
  resetViewState: () => void;
}>;

const SendMemoResetContext = createContext<SendMemoResetContextValue | null>(null);

type SendMemoResetProviderProps = Readonly<{
  children: ReactNode;
}>;

export function SendMemoResetProvider({ children }: SendMemoResetProviderProps) {
  const resetFnRef = useRef<(() => void) | null>(null);
  const skipConfirmedRef = useRef(false);
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();

  const registerResetViewState = useCallback((resetViewState: () => void) => {
    resetFnRef.current = resetViewState;
    return () => {
      if (resetFnRef.current === resetViewState) {
        resetFnRef.current = null;
      }
    };
  }, []);

  const markMemoSkipped = useCallback(() => {
    skipConfirmedRef.current = true;
  }, []);

  const resetViewState = useCallback(() => {
    if (resetFnRef.current) {
      resetFnRef.current();
    } else if (skipConfirmedRef.current && state.recipient) {
      transaction.setRecipient({
        ...state.recipient,
        memo: {
          value: "",
          type: sendFeatures.getMemoDefaultOption(state.account.currency ?? undefined),
        },
      });
    }
    skipConfirmedRef.current = false;
  }, [state.account.currency, state.recipient, transaction]);

  const value = useMemo(
    () => ({
      registerResetViewState,
      markMemoSkipped,
      resetViewState,
    }),
    [markMemoSkipped, registerResetViewState, resetViewState],
  );

  return <SendMemoResetContext.Provider value={value}>{children}</SendMemoResetContext.Provider>;
}

export function useSendMemoReset(): SendMemoResetContextValue {
  const context = useContext(SendMemoResetContext);
  if (!context) {
    throw new Error("useSendMemoReset must be used within a SendMemoResetProvider");
  }
  return context;
}
