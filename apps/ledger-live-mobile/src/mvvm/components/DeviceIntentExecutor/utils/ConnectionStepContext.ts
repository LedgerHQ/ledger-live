import { createContext, useContext, useEffect } from "react";

export type ConnectionStepContextValue = {
  /** Opens the add flow in the connection step, whatever the `lwmDieConnectNewDevice` flag. */
  forceEnableAddNewDevice: boolean;
  /** Shows the back arrow of the sheet header, which calls `back`. `null` hides it. */
  setBack: (back: (() => void) | null) => void;
};

const ConnectionStepContext = createContext<ConnectionStepContextValue>({
  forceEnableAddNewDevice: false,
  setBack: () => undefined,
});

export const ConnectionStepProvider = ConnectionStepContext.Provider;

export function useConnectionStep(): ConnectionStepContextValue {
  return useContext(ConnectionStepContext);
}

/** Shows the back arrow of the sheet header while the caller is mounted. */
export function useSheetBack(back: () => void): void {
  const { setBack } = useConnectionStep();

  useEffect(() => {
    setBack(back);
  }, [back, setBack]);

  useEffect(() => () => setBack(null), [setBack]);
}
