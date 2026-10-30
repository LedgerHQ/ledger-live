import React, { createContext, useMemo, useState } from "react";

/** A flow that needs a device: the sheet answers it with Connect or a dismiss. */
export type ConnectDeviceRequest = { onConnect: () => void; onDismiss?: () => void };

type ConnectDeviceRequestState = {
  request: ConnectDeviceRequest | undefined;
  setRequest: (request: ConnectDeviceRequest | undefined) => void;
};

// Holds callbacks, which cannot live in Redux next to the sheet's open state.
export const ConnectDeviceRequestContext = createContext<ConnectDeviceRequestState | null>(null);

export function ConnectDeviceRequestProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [request, setRequest] = useState<ConnectDeviceRequest>();
  const value = useMemo(() => ({ request, setRequest }), [request]);
  return (
    <ConnectDeviceRequestContext.Provider value={value}>
      {children}
    </ConnectDeviceRequestContext.Provider>
  );
}
