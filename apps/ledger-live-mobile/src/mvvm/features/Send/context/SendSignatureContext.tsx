import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type SendSignatureContextValue = Readonly<{
  isSigning: boolean;
  /**
   * Open the signature overlay. Pass an `onComplete` callback that will be called after the
   * overlay is dismissed on success. The callback must be provided by a component that lives
   * inside the FlowStackNavigator so it holds a valid navigation reference.
   */
  startSigning: (onComplete?: () => void) => void;
  /**
   * Called by the overlay on signing success: executes the stored `onComplete` callback (e.g.
   * navigate to Confirmation) then dismisses the overlay.
   */
  finishSigning: () => void;
  /** Dismiss the overlay without executing the completion callback (cancel / error). */
  stopSigning: () => void;
}>;

const SendSignatureContext = createContext<SendSignatureContextValue | null>(null);

export function SendSignatureProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSigning, setIsSigning] = useState(false);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);

  const startSigning = useCallback((onComplete?: () => void) => {
    onCompleteRef.current = onComplete;
    setIsSigning(true);
  }, []);

  const stopSigning = useCallback(() => {
    onCompleteRef.current = undefined;
    setIsSigning(false);
  }, []);

  const finishSigning = useCallback(() => {
    const onComplete = onCompleteRef.current;
    onCompleteRef.current = undefined;
    setIsSigning(false);
    onComplete?.();
  }, []);

  const value = useMemo<SendSignatureContextValue>(
    () => ({ isSigning, startSigning, finishSigning, stopSigning }),
    [isSigning, startSigning, finishSigning, stopSigning],
  );

  return <SendSignatureContext.Provider value={value}>{children}</SendSignatureContext.Provider>;
}

export function useSendSignature(): SendSignatureContextValue {
  const context = useContext(SendSignatureContext);
  if (!context) {
    throw new Error("useSendSignature must be used within a SendSignatureProvider");
  }
  return context;
}
