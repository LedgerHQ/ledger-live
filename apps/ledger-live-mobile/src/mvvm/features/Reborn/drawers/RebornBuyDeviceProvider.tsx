import React, { createContext, useMemo, useState } from "react";

/** A flow waiting for a device: Connect resumes it, any other close cancels it. */
export type RebornBuyDeviceNext = { onConnect: () => void; onCancel?: () => void };

type RebornBuyDeviceNextState = {
  next: RebornBuyDeviceNext | undefined;
  setNext: (next: RebornBuyDeviceNext | undefined) => void;
};

// Holds callbacks, which cannot live in Redux next to the sheet's open state.
export const RebornBuyDeviceNextContext = createContext<RebornBuyDeviceNextState | null>(null);

export function RebornBuyDeviceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [next, setNext] = useState<RebornBuyDeviceNext>();
  const value = useMemo(() => ({ next, setNext }), [next]);
  return (
    <RebornBuyDeviceNextContext.Provider value={value}>
      {children}
    </RebornBuyDeviceNextContext.Provider>
  );
}
