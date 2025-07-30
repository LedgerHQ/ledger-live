import React from "react";
import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";

export const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <CountervaluesMarketcapProvider
    bridge={{
      setError: () => {},
      setIds: () => {},
      setLoading: () => {},
      useIds: () => [],
      useLastUpdated: () => 0,
    }}
  >
    {children}
  </CountervaluesMarketcapProvider>
);
